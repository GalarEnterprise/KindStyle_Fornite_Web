import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/services/cart/cart-service', () => ({
  addItem: vi.fn(),
  getCart: vi.fn(),
}))

import { getAuthUser } from '@/lib/auth/middleware'
import { addItem } from '@/lib/services/cart/cart-service'
import { POST as createCartItem } from '@/app/api/cart/route'

const mockGetAuthUser = vi.mocked(getAuthUser)
const mockAddItem = vi.mocked(addItem)

const USER_ID = 'user-1'
const PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000'

function makePost(body: unknown) {
  return new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API /api/cart POST', () => {
  it('responde 401 sin autenticación', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await createCartItem(makePost({ productId: PRODUCT_ID }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('mapea ITEM_ALREADY_IN_CART a 409', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockAddItem.mockResolvedValue({
      success: false,
      error: { code: 'ITEM_ALREADY_IN_CART', message: 'Ese artículo ya está en tu carrito' },
    })

    const response = await createCartItem(makePost({ productId: PRODUCT_ID }))
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('ITEM_ALREADY_IN_CART')
  })

  it('rechaza quantity mayor a 1 con 422', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)

    const response = await createCartItem(makePost({ productId: PRODUCT_ID, quantity: 2 }))
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('responde 201 al agregar un artículo nuevo', async () => {
    mockGetAuthUser.mockResolvedValue({ userId: USER_ID } as never)
    mockAddItem.mockResolvedValue({
      success: true,
      data: { id: 'cart-1', quantity: 1 },
    })

    const response = await createCartItem(makePost({ productId: PRODUCT_ID }))
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
