import { db } from '@/lib/db/client'
import { encryptCredentials } from '@/lib/services/cart/crypto-service'
import { SPECIAL_TYPES, type AddToCartInput, type UpdateCartItemInput, type SpecialCartType } from '@/lib/validators/cart'
import { Prisma, type CartItemType, type GiftabilityStatus, type ProductType } from '@prisma/client'

const MAX_QUANTITY = 10

export interface CartItemWithProduct {
  id: string
  productId: string
  quantity: number
  type: CartItemType
  createdAt: Date
  product: {
    id: string
    name: string
    slug: string
    type: ProductType
    priceVbucks: number
    adminPriceMxn: number | null
    imageUrl: string | null
    iconUrl: string | null
    giftable: GiftabilityStatus
  }
}

function mapProductTypeToCartType(productType: ProductType): CartItemType {
  switch (productType) {
    case 'VBucks':
      return 'VBucks'
    case 'CREW':
      return 'CREW'
    case 'BATTLE_PASS':
      return 'BATTLE_PASS'
    default:
      return 'GIFT'
  }
}

function isSpecialType(productType: ProductType): boolean {
  return (SPECIAL_TYPES as readonly string[]).includes(productType)
}

export async function getCart(userId: string): Promise<CartItemWithProduct[]> {
  const items = await db.cartItem.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  })

  if (items.length === 0) return []

  const productIds = [...new Set(items.map((item) => item.product_id))]
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      price_vbucks: true,
      admin_price_mxn: true,
      image_url: true,
      icon_url: true,
      giftable: true,
    },
  })

  const productsById = new Map(products.map((product) => [product.id, product]))

  const result: CartItemWithProduct[] = []
  for (const item of items) {
    const product = productsById.get(item.product_id)
    if (!product) continue

    result.push({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      type: item.type,
      createdAt: item.created_at,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        priceVbucks: product.price_vbucks,
        adminPriceMxn: product.admin_price_mxn ? Number(product.admin_price_mxn) : null,
        imageUrl: product.image_url,
        iconUrl: product.icon_url,
        giftable: product.giftable,
      },
    })
  }

  return result
}

export async function addItem(userId: string, input: AddToCartInput) {
  const product = await db.product.findUnique({ where: { id: input.productId } })

  if (!product || !product.active || !product.visible) {
    return {
      success: false as const,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'El producto no existe o no está disponible' },
    }
  }

  if (product.giftable === 'NOT_GIFTABLE') {
    return {
      success: false as const,
      error: { code: 'NOT_GIFTABLE', message: 'Este producto no puede ser regalado actualmente' },
    }
  }

  if (isSpecialType(product.type) && !input.credentials) {
    return {
      success: false as const,
      error: { code: 'CREDENTIALS_REQUIRED', message: 'Este producto requiere tus credenciales de Epic' },
    }
  }

  const existing = await db.cartItem.findUnique({
    where: { user_id_product_id: { user_id: userId, product_id: input.productId } },
  })

  if (existing) {
    const newQuantity = Math.min(existing.quantity + input.quantity, MAX_QUANTITY)
    const updated = await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    })
    return { success: true as const, data: { id: updated.id, quantity: updated.quantity } }
  }

  const data: Prisma.CartItemUncheckedCreateInput = {
    user_id: userId,
    product_id: input.productId,
    quantity: input.quantity,
    type: mapProductTypeToCartType(product.type),
  }

  if (input.credentials) {
    data.encrypted_credentials = encryptCredentials(
      JSON.stringify({ epicEmail: input.credentials.epicEmail, epicPassword: input.credentials.epicPassword })
    ) as unknown as Prisma.InputJsonValue
  }

  const created = await db.cartItem.create({ data })
  return { success: true as const, data: { id: created.id, quantity: created.quantity } }
}

export async function updateItem(userId: string, itemId: string, input: UpdateCartItemInput) {
  const item = await db.cartItem.findFirst({
    where: { id: itemId, user_id: userId },
  })

  if (!item) {
    return {
      success: false as const,
      error: { code: 'ITEM_NOT_FOUND', message: 'El artículo no existe en tu carrito' },
    }
  }

  const data: Prisma.CartItemUncheckedUpdateInput = {}

  if (input.quantity !== undefined) data.quantity = Math.min(input.quantity, MAX_QUANTITY)
  if (input.credentials) {
    data.encrypted_credentials = encryptCredentials(
      JSON.stringify({ epicEmail: input.credentials.epicEmail, epicPassword: input.credentials.epicPassword })
    ) as unknown as Prisma.InputJsonValue
  }

  const updated = await db.cartItem.update({ where: { id: itemId }, data })
  return { success: true as const, data: { id: updated.id, quantity: updated.quantity } }
}

export async function removeItem(userId: string, itemId: string) {
  const item = await db.cartItem.findFirst({
    where: { id: itemId, user_id: userId },
  })

  if (!item) {
    return {
      success: false as const,
      error: { code: 'ITEM_NOT_FOUND', message: 'El artículo no existe en tu carrito' },
    }
  }

  await db.cartItem.delete({ where: { id: itemId } })
  return { success: true as const, data: { id: itemId } }
}

export async function clearCart(userId: string) {
  await db.cartItem.deleteMany({ where: { user_id: userId } })
  return { success: true as const, data: { cleared: true } }
}
