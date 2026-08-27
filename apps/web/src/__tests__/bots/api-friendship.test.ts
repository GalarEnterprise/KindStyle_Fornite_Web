import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    friendshipRequest: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    friendshipRequestBot: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    fulfillmentAccount: { findMany: vi.fn(), update: vi.fn() },
    eventLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { getAuthUser } from '@/lib/auth/middleware'
import { GET as getStatus, POST as registerPlatformRoute } from '@/app/api/friendship/route'
import { POST as addBot } from '@/app/api/friendship/[id]/add-bot/route'

const mockGetAuthUser = vi.mocked(getAuthUser)

function makeRequest(init?: RequestInit) {
  return new NextRequest('http://localhost:3000/api/friendship', {
    ...init,
    signal: init?.signal ?? undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API /api/friendship', () => {
  it('GET responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await getStatus(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('POST responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await registerPlatformRoute(makeRequest({ method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('POST responde 400 con payload inválido', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: 'user-1' } as never)

    const response = await registerPlatformRoute(
      makeRequest({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ platform: 'STEAM', platform_user_id: '' }),
      })
    )

    expect(response.status).toBe(400)
  })
})

describe('API /api/friendship/[id]/add-bot', () => {
  it('POST responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await addBot(makeRequest({ method: 'POST' }), {
      params: Promise.resolve({ id: 'fr-1' }),
    })

    expect(response.status).toBe(401)
  })
})
