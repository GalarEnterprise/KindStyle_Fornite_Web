import { db } from '@/lib/db/client'
import { encryptCredentials } from '@/lib/services/cart/crypto-service'
import { SPECIAL_TYPES, type AddToCartInput, type UpdateCartItemInput } from '@/lib/validators/cart'
import { Prisma, type CartItemType, type GiftabilityStatus, type ProductType } from '@prisma/client'

const MAX_QUANTITY = 1

export interface CartBundleComponent {
  productId: string
  name: string
  slug: string
}

export interface CartItemWithProduct {
  id: string
  productId: string | null
  quantity: number
  type: CartItemType
  createdAt: Date
  bundleOfferId: string | null
  bundleName: string | null
  bundlePriceVbucks: number | null
  bundleComponents: CartBundleComponent[] | null
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
  } | null
}

interface BundleOffer {
  offerId: string
  name: string
  imageUrl: string | null
  priceVbucks: number
  components: CartBundleComponent[]
  giftable: GiftabilityStatus
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

export async function getBundleByOfferId(offerId: string): Promise<BundleOffer | null> {
  const snapshot = await db.shopSnapshot.findFirst({
    orderBy: { fetched_at: 'desc' },
  })

  if (!snapshot) return null

  const items = await db.shopItem.findMany({
    where: {
      shop_snapshot_id: snapshot.id,
      offer_id: offerId,
      bundle_info: { not: Prisma.DbNull },
    },
    include: { product: true },
  })

  if (items.length === 0) return null

  const firstItem = items[0]
  const bundleInfo = firstItem.bundle_info as { name?: string; image?: string } | null

  const components = items.map((item) => ({
    productId: item.product_id,
    name: item.product.name,
    slug: item.product.slug,
  }))

  return {
    offerId,
    name: bundleInfo?.name ?? firstItem.product.name,
    imageUrl: bundleInfo?.image ?? firstItem.product.image_url,
    priceVbucks: firstItem.price_vbucks,
    components,
    giftable: firstItem.product.giftable,
  }
}

export async function getCart(userId: string): Promise<CartItemWithProduct[]> {
  const items = await db.cartItem.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  })

  if (items.length === 0) return []

  const productIds = [
    ...new Set(items.map((item) => item.product_id).filter((id): id is string => Boolean(id))),
  ]

  const products = productIds.length
    ? await db.product.findMany({
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
    : []

  const productsById = new Map(products.map((product) => [product.id, product]))

  const result: CartItemWithProduct[] = []
  for (const item of items) {
    if (item.type === 'BUNDLE') {
      result.push({
        id: item.id,
        productId: item.product_id,
        quantity: 1,
        type: item.type,
        createdAt: item.created_at,
        bundleOfferId: item.bundle_offer_id,
        bundleName: item.bundle_name,
        bundlePriceVbucks: item.bundle_price_vbucks,
        bundleComponents: (item.bundle_components ?? null) as CartBundleComponent[] | null,
        product: null,
      })
      continue
    }

    const product = productsById.get(item.product_id ?? '')
    if (!product) continue

    result.push({
      id: item.id,
      productId: item.product_id,
      quantity: 1,
      type: item.type,
      createdAt: item.created_at,
      bundleOfferId: null,
      bundleName: null,
      bundlePriceVbucks: null,
      bundleComponents: null,
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
  if (input.offerId) {
    return addBundleItem(userId, { offerId: input.offerId, quantity: input.quantity })
  }

  if (!input.productId) {
    return {
      success: false as const,
      error: { code: 'VALIDATION_ERROR', message: 'Debe proporcionar productId o offerId' },
    }
  }

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
    return {
      success: false as const,
      error: {
        code: 'ITEM_ALREADY_IN_CART',
        message: 'Ese artículo ya está en tu carrito',
      },
    }
  }

  const data: Prisma.CartItemUncheckedCreateInput = {
    user_id: userId,
    product_id: input.productId,
    quantity: 1,
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

export async function addBundleItem(
  userId: string,
  input: { offerId: string; quantity?: number }
) {
  const quantity = 1

  const bundle = await getBundleByOfferId(input.offerId)

  if (!bundle) {
    return {
      success: false as const,
      error: { code: 'BUNDLE_NOT_FOUND', message: 'El bundle no existe o no está disponible' },
    }
  }

  if (bundle.giftable === 'NOT_GIFTABLE') {
    return {
      success: false as const,
      error: { code: 'NOT_GIFTABLE', message: 'Este bundle no puede ser regalado actualmente' },
    }
  }

  const existing = await db.cartItem.findFirst({
    where: { user_id: userId, bundle_offer_id: input.offerId, product_id: null },
  })

  const requiresManualReview = bundle.giftable === 'UNKNOWN'

  if (existing) {
    return {
      success: false as const,
      error: {
        code: 'ITEM_ALREADY_IN_CART',
        message: 'Ese artículo ya está en tu carrito',
      },
    }
  }

  const created = await db.cartItem.create({
    data: {
      user_id: userId,
      product_id: null,
      quantity,
      type: 'BUNDLE',
      bundle_offer_id: input.offerId,
      bundle_name: bundle.name,
      bundle_price_vbucks: bundle.priceVbucks,
      bundle_components: bundle.components as unknown as Prisma.InputJsonValue,
    },
  })

  return {
    success: true as const,
    data: { id: created.id, quantity: created.quantity, requiresManualReview },
  }
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
