import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ALLOW_HTTP = process.env.ALLOW_HTTP_COOKIES === 'true'

function isSecure(): boolean {
  if (!IS_PRODUCTION) return false
  if (ALLOW_HTTP) return false
  return true
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  options?: { secure?: boolean }
) {
  const secure = options?.secure ?? isSecure()

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  })

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  return response
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  return response
}

export function getAuthCookies(request: NextRequest) {
  return {
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  }
}

export function setAdminCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  options?: { secure?: boolean }
) {
  const secure = options?.secure ?? isSecure()

  response.cookies.set('adminAccessToken', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  })

  response.cookies.set('adminRefreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  return response
}

export function clearAdminCookies(response: NextResponse) {
  response.cookies.delete('adminAccessToken')
  response.cookies.delete('adminRefreshToken')
  return response
}

export function getAdminCookies(request: NextRequest) {
  return {
    accessToken: request.cookies.get('adminAccessToken')?.value,
    refreshToken: request.cookies.get('adminRefreshToken')?.value,
  }
}
