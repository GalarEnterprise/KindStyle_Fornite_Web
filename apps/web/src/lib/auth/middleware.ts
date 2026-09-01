import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAuthCookies, getAdminCookies } from './cookies'

export async function requireAuth(request: NextRequest) {
  const { accessToken, refreshToken } = getAuthCookies(request)

  if (!accessToken) {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/login', request.url)),
    }
  }

  const payload = await verifyToken(accessToken)
  if (payload) {
    return { authorized: true, payload }
  }

  if (!refreshToken) {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/login', request.url)),
    }
  }

  try {
    const res = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    })

    if (!res.ok) {
      return {
        authorized: false,
        response: NextResponse.redirect(new URL('/login', request.url)),
      }
    }

    const data = await res.json()
    if (!data.success) {
      return {
        authorized: false,
        response: NextResponse.redirect(new URL('/login', request.url)),
      }
    }

    const newPayload = await verifyToken(data.tokens.accessToken)
    return { authorized: true, payload: newPayload! }
  } catch {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/login', request.url)),
    }
  }
}

export async function requireAdmin(request: NextRequest) {
  const { authorized, response, payload } = await requireAuth(request)

  if (!authorized || !payload) {
    return { authorized: false, response: response! }
  }

  if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/', request.url)),
    }
  }

  return { authorized: true, payload }
}

export async function requireSuperAdmin(request: NextRequest) {
  const { authorized, response, payload } = await requireAuth(request)

  if (!authorized || !payload) {
    return { authorized: false, response: response! }
  }

  if (payload.role !== 'SUPER_ADMIN') {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/', request.url)),
    }
  }

  return { authorized: true, payload }
}

export async function getAuthUser(request: NextRequest) {
  const { accessToken, refreshToken } = getAuthCookies(request)

  if (!accessToken) {
    return null
  }

  const payload = await verifyToken(accessToken)
  if (payload) {
    return payload
  }

  // Intentar refresh si hay refreshToken
  if (refreshToken) {
    try {
      const res = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
        method: 'POST',
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const newPayload = await verifyToken(data.tokens.accessToken)
          return newPayload
        }
      }
    } catch {}
  }

  return null
}
