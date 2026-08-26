import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'test-encryption-key-for-vitest'
})

vi.mock('@/lib/db/client', () => ({
  db: {
    product: { findUnique: vi.fn() },
    cartItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db/client'
import {
  addItem,
  updateItem,
  removeItem,
  getCart,
} from '@/lib/services/cart/cart-service'
import type { AddToCartInput } from '@/lib/validators/cart'

const mockDb = vi.mocked(db, true)

const GIFT_PRODUCT = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Renegade Raider',
  active: true,
  visible: true,
  giftable: 'GIFTABLE',
  type: 'OUTFIT',
  price_vbucks: 1200,
}

const VBUCKS_PRODUCT = {
  ...GIFT_PRODUCT,
  id: '223e4567-e89b-12d3-a456-426614174001',
  name: '1000 V-Bucks',
  type: 'VBucks',
}

const USER_ID = 'user-1'

function mockFindUnique(product: unknown) {
  mockDb.product.findUnique.mockResolvedValue(product as never)
}

describe('Cart Service — addItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('agrega un producto normal sin credenciales', async () => {
    mockFindUnique(GIFT_PRODUCT)
    mockDb.cartItem.findUnique.mockResolvedValue(null)
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-1', quantity: 2 } as never)

    const result = await addItem(USER_ID, {
      productId: GIFT_PRODUCT.id,
      quantity: 2,
    })

    expect(result.success).toBe(true)
    expect(mockDb.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ user_id: USER_ID, quantity: 2, type: 'GIFT' }),
      })
    )
    expect(mockDb.cartItem.create.mock.calls[0][0].data).not.toHaveProperty('encrypted_credentials')
  })

  it('rechaza producto inexistente', async () => {
    mockFindUnique(null)

    const result = await addItem(USER_ID, {
      productId: 'no-existe',
      quantity: 1,
    } as unknown as AddToCartInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('PRODUCT_NOT_FOUND')
  })

  it('rechaza producto no regalable', async () => {
    mockFindUnique({ ...GIFT_PRODUCT, giftable: 'NOT_GIFTABLE' })

    const result = await addItem(USER_ID, { productId: GIFT_PRODUCT.id, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_GIFTABLE')
  })

  it('rechaza producto especial sin credenciales', async () => {
    mockFindUnique(VBUCKS_PRODUCT)

    const result = await addItem(USER_ID, { productId: VBUCKS_PRODUCT.id, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CREDENTIALS_REQUIRED')
  })

  it('producto especial con credenciales se guarda encriptado', async () => {
    mockFindUnique(VBUCKS_PRODUCT)
    mockDb.cartItem.findUnique.mockResolvedValue(null)
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-2', quantity: 1 } as never)

    const result = await addItem(USER_ID, {
      productId: VBUCKS_PRODUCT.id,
      quantity: 1,
      credentials: { epicEmail: 'player@test.com', epicPassword: 'secreto123' },
    })

    expect(result.success).toBe(true)
    const callData = mockDb.cartItem.create.mock.calls[0][0].data
    expect(callData.encrypted_credentials).toBeDefined()
    expect(JSON.stringify(callData)).not.toContain('secreto123')
  })

  it('duplicado incrementa cantidad en vez de fallar', async () => {
    mockFindUnique(GIFT_PRODUCT)
    mockDb.cartItem.findUnique.mockResolvedValue({
      id: 'cart-existing',
      quantity: 4,
      user_id: USER_ID,
      product_id: GIFT_PRODUCT.id,
    } as never)
    mockDb.cartItem.update.mockResolvedValue({ id: 'cart-existing', quantity: 6 } as never)

    const result = await addItem(USER_ID, { productId: GIFT_PRODUCT.id, quantity: 2 })

    expect(result.success).toBe(true)
    expect(mockDb.cartItem.update).toHaveBeenCalledWith({
      where: { id: 'cart-existing' },
      data: { quantity: 6 },
    })
  })
})

describe('Cart Service — updateItem / removeItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updateItem rechaza item ajeno o inexistente', async () => {
    mockDb.cartItem.findFirst.mockResolvedValue(null)

    const result = await updateItem('otro-user', 'item-x', { quantity: 3 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ITEM_NOT_FOUND')
  })

  it('removeItem elimina item propio', async () => {
    mockDb.cartItem.findFirst.mockResolvedValue({ id: 'item-1', user_id: USER_ID } as never)
    mockDb.cartItem.delete.mockResolvedValue({} as never)

    const result = await removeItem(USER_ID, 'item-1')

    expect(result.success).toBe(true)
    expect(mockDb.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('removeItem rechaza item de otro usuario', async () => {
    mockDb.cartItem.findFirst.mockResolvedValue(null)

    const result = await removeItem(USER_ID, 'item-de-otro')

    expect(result.success).toBe(false)
  })
})
