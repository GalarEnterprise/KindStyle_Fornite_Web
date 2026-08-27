import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn() },
    cartItem: { findMany: vi.fn(), deleteMany: vi.fn() },
    product: { findMany: vi.fn() },
    request: { count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    requestItem: { createMany: vi.fn() },
    currencySetting: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { getAuthUser } from '@/lib/auth/middleware'
import { GET as listRequests, POST as createRequest } from '@/app/api/requests/route'

const mockGetAuthUser = vi.mocked(getAuthUser)

function makeRequest(init?: RequestInit) {
  return new NextRequest('http://localhost:3000/api/requests', {
    ...init,
    signal: init?.signal ?? undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API /api/requests', () => {
  it('GET responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await listRequests(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('POST responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await createRequest(makeRequest({ method: 'POST' }))
    expect(response.status).toBe(401)
  })
})
