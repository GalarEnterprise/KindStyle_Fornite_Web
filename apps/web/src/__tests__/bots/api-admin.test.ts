import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    fulfillmentAccount: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    friendshipRequest: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    friendshipRequestBot: { findUnique: vi.fn(), findMany: vi.fn() },
    eventLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { getAuthUser } from '@/lib/auth/middleware'
import { GET as listBotsRoute, POST as createBotRoute } from '@/app/api/admin/bots/route'
import { GET as listQueue } from '@/app/api/admin/friendships/route'

const mockGetAuthUser = vi.mocked(getAuthUser)

function makeAdmin(role: string) {
  return { userId: 'admin-1', role } as never
}

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    ...init,
    signal: init?.signal ?? undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API admin auth guards', () => {
  it('GET /api/admin/bots responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await listBotsRoute(makeRequest('/api/admin/bots'))
    expect(response.status).toBe(401)
  })

  it('GET /api/admin/bots responde 403 sin rol admin', async () => {
    mockGetAuthUser.mockResolvedValue(makeAdmin('USER'))

    const response = await listBotsRoute(makeRequest('/api/admin/bots'))
    expect(response.status).toBe(403)
  })

  it('POST /api/admin/bots responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await createBotRoute(makeRequest('/api/admin/bots', { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('GET /api/admin/friendships responde 403 sin rol admin', async () => {
    mockGetAuthUser.mockResolvedValue(makeAdmin('USER'))

    const response = await listQueue(makeRequest('/api/admin/friendships'))
    expect(response.status).toBe(403)
  })

  it('SUPER_ADMIN tiene acceso', async () => {
    mockGetAuthUser.mockResolvedValue(makeAdmin('SUPER_ADMIN'))

    const response = await listBotsRoute(makeRequest('/api/admin/bots'))
    expect(response.status).toBe(200)
  })
})
