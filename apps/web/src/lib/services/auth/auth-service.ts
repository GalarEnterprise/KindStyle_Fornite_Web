import { db } from '@/lib/db/client'
import { sendVerificationCode } from './email-service'
import { generateTokenPair, verifyRefreshToken } from './token-service'
import { createSession, enforceSessionLimit, findSessionByRefreshToken, revokeSession } from './session-service'
import { createVerificationCode, verifyCode as verifyCodeService, checkCooldown } from './verification-code-service'
import bcrypt from 'bcryptjs'

export async function register(email: string) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: { code: 'EMAIL_EXISTS', message: 'Este email ya está registrado' } }
  }

  // Check cooldown
  const cooldown = await checkCooldown(email, 'EMAIL_VERIFICATION')
  if (!cooldown.allowed) {
    return {
      success: false,
      error: {
        code: 'COOLDOWN',
        message: `Debes esperar ${cooldown.cooldownRemaining} segundos antes de solicitar otro código`,
        cooldownRemaining: cooldown.cooldownRemaining,
      },
    }
  }

  const { code } = await createVerificationCode(email, 'EMAIL_VERIFICATION')

  await sendVerificationCode({ email, code, context: 'REGISTRATION' })

  return { success: true, message: 'Código de verificación enviado' }
}

export async function verifyCode(email: string, code: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN' = 'EMAIL_VERIFICATION') {
  return verifyCodeService(email, code, type)
}

export async function createUser(email: string) {
  const user = await db.user.create({
    data: {
      email,
      role: 'USER',
      verification_status: 'VERIFIED',
    },
  })

  await db.notificationPreference.create({
    data: { user_id: user.id },
  })

  return user
}

export async function requestLoginCode(email: string) {
  // Check cooldown
  const cooldown = await checkCooldown(email, 'LOGIN')
  if (!cooldown.allowed) {
    return {
      success: false,
      error: {
        code: 'COOLDOWN',
        message: `Debes esperar ${cooldown.cooldownRemaining} segundos antes de solicitar otro código`,
        cooldownRemaining: cooldown.cooldownRemaining,
      },
    }
  }

  // Check if user exists
  const user = await db.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: 'Si el email está registrado, recibirás un código de verificación' }
  }

  // Create LOGIN code
  const { code } = await createVerificationCode(email, 'LOGIN', user.id)

  // Send code via email
  await sendVerificationCode({ email, code, context: 'LOGIN' })

  return { success: true, message: 'Si el email está registrado, recibirás un código de verificación' }
}

export async function loginWithCode(email: string, code: string, userAgent?: string, ipAddress?: string) {
  const verificationResult = await verifyCode(email, code, 'LOGIN')
  if (!verificationResult.success) {
    return verificationResult
  }

  let user = await db.user.findUnique({ where: { email } })

  if (!user) {
    user = await createUser(email)
  }

  const tokens = await generateTokenPair(user.id, user.role, user.nickname || undefined)
  await enforceSessionLimit(user.id)

  const session = await createSession(user.id, tokens.accessToken, tokens.refreshToken, userAgent, ipAddress)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      isFirstLogin: !user.nickname,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
) {
  const user = await db.user.findUnique({ where: { email } })

  if (!user || !user.password_hash) {
    return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } }
  }

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } }
  }

  const tokens = await generateTokenPair(user.id, user.role, user.nickname || undefined)
  await enforceSessionLimit(user.id)

  const session = await createSession(user.id, tokens.accessToken, tokens.refreshToken, userAgent, ipAddress)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }
}

export async function createPassword(userId: string, password: string) {
  const hash = await bcrypt.hash(password, 12)

  return db.user.update({
    where: { id: userId },
    data: { password_hash: hash },
  })
}

export async function setNickname(userId: string, nickname: string) {
  return db.user.update({
    where: { id: userId },
    data: { nickname },
  })
}

export async function refreshSession(refreshToken: string, userAgent?: string, ipAddress?: string) {
  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) {
    return { success: false, error: { code: 'INVALID_TOKEN', message: 'Token de refresco inválido' } }
  }

  const session = await findSessionByRefreshToken(refreshToken)
  if (!session) {
    return { success: false, error: { code: 'SESSION_REVOKED', message: 'Sesión revocada' } }
  }

  const tokens = await generateTokenPair(session.user_id, session.user.role, session.user.nickname || undefined)

  await revokeSession(session.token)
  await createSession(session.user_id, tokens.accessToken, tokens.refreshToken, userAgent, ipAddress)

  return {
    success: true,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }
}
