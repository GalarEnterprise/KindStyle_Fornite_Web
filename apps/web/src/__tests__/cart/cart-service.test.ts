import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'test-encryption-key-for-vitest'
})

vi.mock('@/lib/db/client', () => ({
  db: {
    product: { findUnique: vi.fn(), findMany: vi.fn() },
    cartItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    cartConflictResolution: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    shopSnapshot: { findFirst: vi.fn() },
    shopItem: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { db } from '@/lib/db/client'
import {
  addItem,
  addBundleItem,
  resolveCartConflict,
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
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-1', quantity: 1 } as never)

    const result = await addItem(USER_ID, {
      productId: GIFT_PRODUCT.id,
      quantity: 1,
    })

    expect(result.success).toBe(true)
    expect(mockDb.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ user_id: USER_ID, quantity: 1, type: 'GIFT' }),
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

  it('duplicado devuelve ITEM_ALREADY_IN_CART en vez de incrementar', async () => {
    mockFindUnique(GIFT_PRODUCT)
    mockDb.cartItem.findUnique.mockResolvedValue({
      id: 'cart-existing',
      quantity: 1,
      user_id: USER_ID,
      product_id: GIFT_PRODUCT.id,
    } as never)

    const result = await addItem(USER_ID, { productId: GIFT_PRODUCT.id, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ITEM_ALREADY_IN_CART')
    expect(mockDb.cartItem.update).not.toHaveBeenCalled()
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
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

describe('Cart Service — addBundleItem', () => {
  const BUNDLE_OFFER_ID = 'v2:/bundle-offer-1'
  const SNAPSHOT = { id: 'snapshot-1' } as never

  function mockBundleItem(productOverrides: Partial<typeof GIFT_PRODUCT> = {}) {
    mockDb.shopSnapshot.findFirst.mockResolvedValue(SNAPSHOT)
    mockDb.shopItem.findMany.mockResolvedValue([
      {
        price_vbucks: 2500,
        product_id: GIFT_PRODUCT.id,
        bundle_info: { name: 'Pack Completo', image: 'https://img.example.com/bundle.png' },
        product: { ...GIFT_PRODUCT, ...productOverrides },
      } as never,
    ])
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.cartItem.findMany.mockResolvedValue([])
  })

  it('crea un CartItem tipo BUNDLE con precio fijo de la API', async () => {
    mockBundleItem()
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-bundle', quantity: 1 } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 1 })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('added')
    const callData = mockDb.cartItem.create.mock.calls[0][0].data
    expect(callData).toMatchObject({
      user_id: USER_ID,
      product_id: null,
      quantity: 1,
      type: 'BUNDLE',
      bundle_offer_id: BUNDLE_OFFER_ID,
      bundle_name: 'Pack Completo',
      bundle_price_vbucks: 2500,
    })
    expect(callData.bundle_components).toHaveLength(1)
    expect(JSON.stringify(callData)).not.toContain('encrypted_credentials')
  })

  it('rechaza bundle inexistente', async () => {
    mockDb.shopSnapshot.findFirst.mockResolvedValue(SNAPSHOT)
    mockDb.shopItem.findMany.mockResolvedValue([])

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('BUNDLE_NOT_FOUND')
  })

  it('duplicado devuelve ITEM_ALREADY_IN_CART en vez de incrementar', async () => {
    mockBundleItem()
    mockDb.cartItem.findFirst.mockResolvedValue({
      id: 'cart-bundle-existing',
      quantity: 1,
    } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ITEM_ALREADY_IN_CART')
    expect(mockDb.cartItem.update).not.toHaveBeenCalled()
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
  })

  it('bundle con giftable UNKNOWN no se bloquea y marca requiresManualReview', async () => {
    mockBundleItem({ giftable: 'UNKNOWN' })
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-bundle', quantity: 1 } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 1 })

    expect(result.success).toBe(true)
    if (result.success && result.data.status === 'added') {
      expect(result.data.requiresManualReview).toBe(true)
    }
  })

  it('bundle NOT_GIFTABLE se rechaza', async () => {
    mockBundleItem({ giftable: 'NOT_GIFTABLE' })

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_GIFTABLE')
  })

  it('cantidad se fuerza a 1', async () => {
    mockBundleItem()
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-bundle', quantity: 1 } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID, quantity: 99 })

    expect(result.success).toBe(true)
    expect(mockDb.cartItem.create.mock.calls[0][0].data.quantity).toBe(1)
  })
})

const BUNDLE_OFFER_ID = 'v2:/bundle-offer-1'
const RESOLUTION_ID = '423e4567-e89b-12d3-a456-426614174003'
const CONFLICT_CART_ITEM_ID = 'cart-item-conflict-1'

function futureDate() {
  return new Date(Date.now() + 10 * 60 * 1000)
}

function mockBundleInShop(priceVbucks = 2500) {
  mockDb.shopSnapshot.findFirst.mockResolvedValue({ id: 'snapshot-1' } as never)
  mockDb.shopItem.findMany.mockResolvedValue([
    {
      price_vbucks: priceVbucks,
      product_id: GIFT_PRODUCT.id,
      bundle_info: { name: 'Pack Completo', image: 'https://img.example.com/bundle.png' },
      product: { ...GIFT_PRODUCT },
    } as never,
  ])
}

function mockPendingResolution(overrides: Record<string, unknown> = {}) {
  mockDb.cartConflictResolution.findUnique.mockResolvedValue({
    id: RESOLUTION_ID,
    user_id: USER_ID,
    bundle_offer_id: BUNDLE_OFFER_ID,
    bundle_name: 'Pack Completo',
    bundle_price_vbucks: 2500,
    bundle_components: [
      { productId: GIFT_PRODUCT.id, name: GIFT_PRODUCT.name, slug: 'renegade-raider' },
    ],
    conflicting_items: [
      {
        cartItemId: CONFLICT_CART_ITEM_ID,
        productId: GIFT_PRODUCT.id,
        name: GIFT_PRODUCT.name,
        slug: 'renegade-raider',
      },
    ],
    status: 'PENDING',
    expires_at: futureDate(),
    ...overrides,
  } as never)
}

interface TxMock {
  cartConflictResolution: {
    updateMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  cartItem: {
    findFirst: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

function makeTx(overrides?: Partial<TxMock>): TxMock {
  return {
    cartConflictResolution: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({ id: RESOLUTION_ID }),
    },
    cartItem: {
      findFirst: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: 'cart-bundle-new', quantity: 1 }),
    },
    ...overrides,
  }
}

function mockTransactionRun(tx: TxMock) {
  mockDb.$transaction.mockImplementation(((fn: (client: unknown) => Promise<unknown>) =>
    fn(tx)) as never)
}

describe('Cart Service — conflictos bundle/artículo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.cartItem.findMany.mockResolvedValue([])
  })

  it('sin solapamiento agrega directamente sin crear resolución', async () => {
    mockBundleInShop()
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.findMany.mockResolvedValue([])
    mockDb.cartItem.create.mockResolvedValue({ id: 'cart-bundle', quantity: 1 } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('added')
    expect(mockDb.cartConflictResolution.create).not.toHaveBeenCalled()
  })

  it('con artículo individual en el carrito devuelve pending_resolution y no muta el carrito', async () => {
    mockBundleInShop()
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.findMany.mockResolvedValue([
      { id: CONFLICT_CART_ITEM_ID, product_id: GIFT_PRODUCT.id, type: 'GIFT' } as never,
    ])
    mockDb.cartConflictResolution.create.mockResolvedValue({
      id: RESOLUTION_ID,
      expires_at: futureDate(),
    } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID })

    expect(result.success).toBe(true)
    if (result.success && result.data.status === 'pending_resolution') {
      expect(result.data.resolutionId).toBe(RESOLUTION_ID)
      expect(result.data.conflictingItems).toEqual([
        {
          cartItemId: CONFLICT_CART_ITEM_ID,
          productId: GIFT_PRODUCT.id,
          name: GIFT_PRODUCT.name,
          slug: '',
        },
      ])
      expect(result.data.bundle).toMatchObject({
        offerId: BUNDLE_OFFER_ID,
        name: 'Pack Completo',
        priceVbucks: 2500,
      })
    } else {
      throw new Error('esperaba pending_resolution')
    }
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.delete).not.toHaveBeenCalled()
    expect(mockDb.cartItem.deleteMany).not.toHaveBeenCalled()
    expect(mockDb.cartConflictResolution.create).toHaveBeenCalledTimes(1)
  })

  it('bundle duplicado devuelve ITEM_ALREADY_IN_CART sin abrir resolución', async () => {
    mockBundleInShop()
    mockDb.cartItem.findFirst.mockResolvedValue({ id: 'cart-bundle-existing' } as never)

    const result = await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ITEM_ALREADY_IN_CART')
    expect(mockDb.cartConflictResolution.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.findMany).not.toHaveBeenCalled()
  })

  it('la resolución se crea asociada al usuario', async () => {
    mockBundleInShop()
    mockDb.cartItem.findFirst.mockResolvedValue(null)
    mockDb.cartItem.findMany.mockResolvedValue([
      { id: CONFLICT_CART_ITEM_ID, product_id: GIFT_PRODUCT.id, type: 'GIFT' } as never,
    ])
    mockDb.cartConflictResolution.create.mockResolvedValue({
      id: RESOLUTION_ID,
      expires_at: futureDate(),
    } as never)

    await addBundleItem(USER_ID, { offerId: BUNDLE_OFFER_ID })

    const data = mockDb.cartConflictResolution.create.mock.calls[0][0].data
    expect(data.user_id).toBe(USER_ID)
    expect(data.status ?? 'PENDING').toBe('PENDING')
    expect(new Date(data.expires_at).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('Cart Service — resolveCartConflict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keep_separate conserva el carrito y consume la resolución', async () => {
    mockPendingResolution()
    mockDb.cartConflictResolution.updateMany.mockResolvedValue({ count: 1 } as never)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('kept_separate')
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.deleteMany).not.toHaveBeenCalled()
    expect(mockDb.cartConflictResolution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: RESOLUTION_ID, status: 'PENDING' }),
        data: { status: 'KEPT_SEPARATE' },
      })
    )
  })

  it('resolución de otro usuario se rechaza sin modificar el carrito', async () => {
    mockPendingResolution({ user_id: 'otro-user' })

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.deleteMany).not.toHaveBeenCalled()
    expect(mockDb.cartConflictResolution.updateMany).not.toHaveBeenCalled()
  })

  it('resolución vencida se rechaza', async () => {
    mockPendingResolution({ expires_at: new Date(Date.now() - 1000) })

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
  })

  it('resolución ya consumida se rechaza', async () => {
    mockPendingResolution({ status: 'REPLACED_BY_BUNDLE' })

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('resolución inexistente se rechaza', async () => {
    mockDb.cartConflictResolution.findUnique.mockResolvedValue(null)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
  })

  it('keep_separate consume exactamente una vez ante carrera', async () => {
    mockPendingResolution()
    mockDb.cartConflictResolution.updateMany.mockResolvedValue({ count: 0 } as never)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'keep_separate',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
  })

  it('replace_with_bundle elimina conflictos y agrega el bundle en una transacción', async () => {
    mockPendingResolution()
    mockBundleInShop()
    const tx = makeTx()
    mockTransactionRun(tx)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(true)
    if (result.success && result.data.status === 'replaced_by_bundle') {
      expect(result.data.id).toBe('cart-bundle-new')
      expect(result.data.removedItemIds).toEqual([CONFLICT_CART_ITEM_ID])
    } else {
      throw new Error('esperaba replaced_by_bundle')
    }
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: [CONFLICT_CART_ITEM_ID] },
          user_id: USER_ID,
          type: { not: 'BUNDLE' },
          product_id: { not: null },
        }),
      })
    )
    const createData = tx.cartItem.create.mock.calls[0][0].data
    expect(createData).toMatchObject({
      user_id: USER_ID,
      type: 'BUNDLE',
      bundle_offer_id: BUNDLE_OFFER_ID,
      bundle_price_vbucks: 2500,
      quantity: 1,
    })
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.deleteMany).not.toHaveBeenCalled()
  })

  it('si el bundle cambia de precio antes de confirmar, se invalida y no se muta el carrito', async () => {
    mockPendingResolution()
    mockBundleInShop(9999)
    mockDb.cartConflictResolution.updateMany.mockResolvedValue({ count: 1 } as never)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
    expect(mockDb.$transaction).not.toHaveBeenCalled()
    expect(mockDb.cartConflictResolution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'INVALIDATED' } })
    )
  })

  it('si el bundle desaparece antes de confirmar, se rechaza la sustitución', async () => {
    mockPendingResolution()
    mockDb.shopSnapshot.findFirst.mockResolvedValue({ id: 'snapshot-1' } as never)
    mockDb.shopItem.findMany.mockResolvedValue([])
    mockDb.cartConflictResolution.updateMany.mockResolvedValue({ count: 1 } as never)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_CONFLICT_RESOLUTION_INVALID')
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('si el bundle ya entró por otra pestaña, devuelve ITEM_ALREADY_IN_CART', async () => {
    mockPendingResolution()
    mockBundleInShop()
    const tx = makeTx({
      cartItem: {
        findFirst: vi.fn().mockResolvedValue({ id: 'bundle-other-tab' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'nope', quantity: 1 }),
      },
    })
    mockTransactionRun(tx)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ITEM_ALREADY_IN_CART')
    expect(tx.cartItem.create).not.toHaveBeenCalled()
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled()
  })

  it('si la transacción falla, devuelve error de operación sin estado parcial', async () => {
    mockPendingResolution()
    mockBundleInShop()
    const tx = makeTx({
      cartItem: {
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockRejectedValue(new Error('db unavailable')),
      },
    })
    mockTransactionRun(tx)

    const result = await resolveCartConflict(USER_ID, {
      resolutionId: RESOLUTION_ID,
      decision: 'replace_with_bundle',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('CART_OPERATION_FAILED')
    expect(tx.cartItem.deleteMany).toHaveBeenCalled()
    expect(mockDb.cartItem.create).not.toHaveBeenCalled()
    expect(mockDb.cartItem.deleteMany).not.toHaveBeenCalled()
    expect(mockDb.cartConflictResolution.updateMany).not.toHaveBeenCalled()
  })
})
