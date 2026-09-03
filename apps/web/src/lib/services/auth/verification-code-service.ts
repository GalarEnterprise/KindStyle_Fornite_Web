import { db } from '@/lib/db/client'
import { randomInt } from 'crypto'

const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const COOLDOWN_MS = 3 * 60 * 1000 // 3 minutes
const MAX_ATTEMPTS = 10
const CODE_LENGTH = 6

export type VerificationCodeType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN'

export interface VerificationResult {
  success: boolean
  error?: {
    code: string
    message: string
    blockedUntil?: string
    cooldownRemaining?: number
  }
  verification?: {
    id: string
    email: string
    type: VerificationCodeType
  }
}

export function generateCode(): string {
  const min = Math.pow(10, CODE_LENGTH - 1)
  const max = Math.pow(10, CODE_LENGTH) - 1
  return randomInt(min, max + 1).toString()
}

export async function createVerificationCode(
  email: string,
  type: VerificationCodeType,
  userId?: string
): Promise<{ code: string; id: string }> {
  // Invalidate any existing active codes of the same type for this email
  await db.verificationCode.updateMany({
    where: {
      email,
      type,
      verified: false,
    },
    data: { verified: true },
  })

  const code = generateCode()

  const verification = await db.verificationCode.create({
    data: {
      user_id: userId || null,
      email,
      code,
      type,
      expires_at: new Date(Date.now() + CODE_EXPIRY_MS),
      attempts: 0,
    },
  })

  return { code, id: verification.id }
}

export async function verifyCode(
  email: string,
  code: string,
  type: VerificationCodeType
): Promise<VerificationResult> {
  const verification = await db.verificationCode.findFirst({
    where: { email, code, type, verified: false },
    orderBy: { created_at: 'desc' },
  })

  if (!verification) {
    return { success: false, error: { code: 'INVALID_CODE', message: 'Código inválido' } }
  }

  // Check if blocked due to too many attempts
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

  // Check if expired
  if (verification.expires_at < new Date()) {
    return { success: false, error: { code: 'EXPIRED', message: 'El código ha expirado' } }
  }

  // Check code match
  if (verification.code !== code) {
    await db.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    })
    return { success: false, error: { code: 'INVALID_CODE', message: 'Código incorrecto' } }
  }

  // Mark as verified (one-time use)
  await db.verificationCode.update({
    where: { id: verification.id },
    data: { verified: true },
  })

  return {
    success: true,
    verification: {
      id: verification.id,
      email: verification.email,
      type: verification.type,
    },
  }
}

export async function checkCooldown(
  email: string,
  type: VerificationCodeType
): Promise<{ allowed: boolean; cooldownRemaining?: number }> {
  const lastCode = await db.verificationCode.findFirst({
    where: { email, type },
    orderBy: { created_at: 'desc' },
  })

  if (!lastCode) {
    return { allowed: true }
  }

  const cooldownEnd = new Date(lastCode.created_at.getTime() + COOLDOWN_MS)
  const now = new Date()

  if (now < cooldownEnd) {
    const remaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000)
    return { allowed: false, cooldownRemaining: remaining }
  }

  return { allowed: true }
}
