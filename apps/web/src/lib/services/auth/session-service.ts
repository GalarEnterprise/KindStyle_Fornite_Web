import { db } from '@/lib/db/client'

export async function createSession(
  userId: string,
  token: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
) {
  return db.session.create({
    data: {
      user_id: userId,
      token,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      user_agent: userAgent,
      ip_address: ipAddress,
    },
  })
}

export async function validateSession(accessToken: string) {
  const session = await db.session.findFirst({
    where: {
      token: accessToken,
      expires_at: { gt: new Date() },
    },
    include: {
      user: true,
    },
  })

  return session
}

export async function revokeSession(token: string) {
  return db.session.deleteMany({
    where: { token },
  })
}

export async function getUserSessions(userId: string) {
  return db.session.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      created_at: true,
      expires_at: true,
      user_agent: true,
      ip_address: true,
    },
  })
}

export async function enforceSessionLimit(userId: string) {
  const sessions = await db.session.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'asc' },
  })

  if (sessions.length >= 2) {
    await db.session.delete({
      where: { id: sessions[0].id },
    })
    return { revoked: true, revokedSessionId: sessions[0].id }
  }

  return { revoked: false }
}

export async function revokeAllUserSessions(userId: string) {
  return db.session.deleteMany({
    where: { user_id: userId },
  })
}

export async function findSessionByRefreshToken(refreshToken: string) {
  return db.session.findFirst({
    where: {
      refresh_token: refreshToken,
      expires_at: { gt: new Date() },
    },
    include: {
      user: true,
    },
  })
}
