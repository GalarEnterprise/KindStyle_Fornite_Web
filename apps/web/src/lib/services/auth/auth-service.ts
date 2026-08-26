import { db } from '@/lib/db/client'
import { sendVerificationCode } from './email-service'
import { generateTokenPair, verifyRefreshToken } from './token-service'
import { createSession, enforceSessionLimit, findSessionByRefreshToken, revokeSession } from './session-service'
import bcrypt from 'bcryptjs'

const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const COOLDOWN_MS = 3 * 60 * 1000 // 3 minutes
const MAX_ATTEMPTS = 10

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function register(email: string) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: { code: 'EMAIL_EXISTS', message: 'Este email ya está registrado' } }
  }

  const code = generateCode()

  await db.verificationCode.create({
    data: {
      email,
      code,
      expires_at: new Date(Date.now() + CODE_EXPIRY_MS),
      attempts: 0,
    },
  })

  await sendVerificationCode(email, code)

  return { success: true, message: 'Código de verificación enviado' }
}

export async function verifyCode(email: string, code: string) {
  const verification = await db.verificationCode.findFirst({
    where: { email, code, verified: false },
    orderBy: { created_at: 'desc' },
  })

  if (!verification) {
    return { success: false, error: { code: 'INVALID_CODE', message: 'Código inválido' } }
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(verification.created_at.getTime() + BLOCK_DURATION_MS)
    if (new Date() < blockedUntil) {
      return {
        success: false,
        error: {
          code: 'BLOCKED',
          message: `Demasiados intentos. Intenta de nuevo en ${Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)} minutos`,
          blockedUntil: blockedUntil.toISOString(),
        },
      }
    }
  }

  if (verification.expires_at < new Date()) {
    return { success: false, error: { code: 'EXPIRED', message: 'El código ha expirado' } }
  }

  if (verification.code !== code) {
    await db.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    })
    return { success: false, error: { code: 'INVALID_CODE', message: 'Código incorrecto' } }
  }

  await db.verificationCode.update({
    where: { id: verification.id },
    data: { verified: true },
  })

  return { success: true, verified: true }
}

export async function createUser(email: string) {
  const user = await db.user.create({
    data: {
      email,
      role: 'USER',
      verification_status: 'VERIFIED',
    },
  })

  return user
}

export async function loginWithCode(email: string, code: string, userAgent?: string, ipAddress?: string) {
  const verificationResult = await verifyCode(email, code)
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
