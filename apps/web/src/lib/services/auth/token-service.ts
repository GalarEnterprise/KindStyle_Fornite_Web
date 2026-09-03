import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@kindstyle/database'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'
)
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-do-not-use-in-production'
)

const ACCESS_TOKEN_EXP = '15m'
const REFRESH_TOKEN_EXP = '7d'

export interface TokenPayload {
  userId: string
  role: UserRole
  nickname?: string
}

export interface RefreshPayload {
  userId: string
}

export async function generateAccessToken(userId: string, role: UserRole, nickname?: string): Promise<string> {
  return new SignJWT({ userId, role, nickname })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXP)
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXP)
    .sign(REFRESH_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      nickname: payload.nickname as string | undefined,
    }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET)
    return {
      userId: payload.userId as string,
    }
  } catch {
    return null
  }
}

export async function generateTokenPair(userId: string, role: UserRole, nickname?: string) {
  return {
    accessToken: await generateAccessToken(userId, role, nickname),
    refreshToken: await generateRefreshToken(userId),
  }
}

export async function generateResetToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'password_reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(JWT_SECRET)
}

export async function verifyResetToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== 'password_reset') return null
    return { email: payload.email as string }
  } catch {
    return null
  }
}
