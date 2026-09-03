import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/services/cart/cart-service', () => ({
  resolveCartConflict: vi.fn(),
}))

import { getAuthUser } from '@/lib/auth/middleware'
import { resolveCartConflict } from '@/lib/services/cart/cart-service'
import { POST as resolveConflict } from '@/app/api/cart/resolve-conflict/route'

const mockGetAuthUser = vi.mocked(getAuthUser)
const mockResolve = vi.mocked(resolveCartConflict)

const USER_ID = 'user-1'
const RESOLUTION_ID = '423e4567-e89b-12d3-a456-426614174003'

function makePost(body: unknown) {
  return new NextRequest('http://localhost:3000/api/cart/resolve-conflict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API /api/cart/resolve-conflict POST', () => {
  it('responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'keep_separate' })
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('responde 422 con decisión fuera del contrato', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'remove_everything' })
    )
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(mockResolve).not.toHaveBeenCalled()
  })

  it('responde 422 con resolutionId ajeno al formato (no UUID)', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)

    const response = await resolveConflict(
      makePost({ resolutionId: 'otro-id', decision: 'keep_separate' })
    )
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(mockResolve).not.toHaveBeenCalled()
  })

  it('responde 409 cuando la resolución es inválida o vencida', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockResolve.mockResolvedValue({
      success: false,
      error: { code: 'CART_CONFLICT_RESOLUTION_INVALID', message: 'La confirmación expiró' },
    })

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'replace_with_bundle' })
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
  })

  it('responde 200 con kept_separate al conservar artículos por separado', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockResolve.mockResolvedValue({
      success: true,
      data: { status: 'kept_separate', resolutionId: RESOLUTION_ID },
    })

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'keep_separate' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.status).toBe('kept_separate')
    expect(mockResolve).toHaveBeenCalledWith(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })
  })

  it('responde 200 con replaced_by_bundle al sustituir por el pack', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockResolve.mockResolvedValue({
      success: true,
      data: {
        status: 'replaced_by_bundle',
        id: 'cart-bundle-new',
        quantity: 1,
        removedItemIds: ['ci-1'],
        requiresManualReview: false,
      },
    })

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'replace_with_bundle' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.status).toBe('replaced_by_bundle')
    expect(data.data.removedItemIds).toEqual(['ci-1'])
  })

  it('responde 500 con CART_OPERATION_FAILED si la transacción falló', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockResolve.mockResolvedValue({
      success: false,
      error: { code: 'CART_OPERATION_FAILED', message: 'No se pudo completar la sustitución.' },
    })

    const response = await resolveConflict(
      makePost({ resolutionId: RESOLUTION_ID, decision: 'replace_with_bundle' })
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error.code).toBe('CART_OPERATION_FAILED')
  })
})
