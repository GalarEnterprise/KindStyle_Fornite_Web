import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/services/requests/request-service', () => ({
  getRequestById: vi.fn(),
  deleteRequest: vi.fn(),
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
import { deleteRequest as deleteRequestService } from '@/lib/services/requests/request-service'
import { GET as listRequests, POST as createRequest } from '@/app/api/requests/route'
import { DELETE as deleteRequestRoute } from '@/app/api/requests/[id]/route'

const mockGetAuthUser = vi.mocked(getAuthUser)
const mockDeleteRequest = vi.mocked(deleteRequestService)

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

describe('API /api/requests/[id] DELETE', () => {
  function makeDeleteRequest(id: string, init?: RequestInit) {
    return new NextRequest(`http://localhost:3000/api/requests/${id}`, {
      method: 'DELETE',
      ...init,
      signal: init?.signal ?? undefined,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await deleteRequestRoute(makeDeleteRequest('11111111-1111-4111-8111-111111111111'), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) })

    expect(response.status).toBe(401)
  })

  it('responde 404 si la solicitud no existe o es ajena', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: 'user-1' } as never)
    mockDeleteRequest.mockResolvedValue({
      success: false as const,
      error: { code: 'REQUEST_NOT_FOUND', message: 'La solicitud no existe' },
    })

    const response = await deleteRequestRoute(makeDeleteRequest('22222222-2222-4222-8222-222222222222'), { params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('REQUEST_NOT_FOUND')
  })

  it('elimina una solicitud propia con éxito', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: 'user-1' } as never)
    mockDeleteRequest.mockResolvedValue({ success: true as const, data: { id: '11111111-1111-4111-8111-111111111111' } })

    const response = await deleteRequestRoute(makeDeleteRequest('11111111-1111-4111-8111-111111111111'), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteRequest).toHaveBeenCalledWith('user-1', '11111111-1111-4111-8111-111111111111')
  })
})
