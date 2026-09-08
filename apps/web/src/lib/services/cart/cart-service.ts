import { db } from '@/lib/db/client'
import { encryptCredentials } from '@/lib/services/cart/crypto-service'
import {
  SPECIAL_TYPES,
  type AddToCartInput,
  type ResolveCartConflictInput,
  type UpdateCartItemInput,
} from '@/lib/validators/cart'
import { Prisma, type CartItemType, type GiftabilityStatus, type ProductType } from '@prisma/client'

const MAX_QUANTITY = 1
const CART_CONFLICT_RESOLUTION_TTL_MS = 10 * 60 * 1000

export interface CartBundleComponent {
  productId: string
  name: string
  slug: string
}

export interface CartConflictItem {
  cartItemId: string
  productId: string
  name: string
  slug: string
}

export interface CartConflictBundleInfo {
  offerId: string
  name: string
  imageUrl: string | null
  priceVbucks: number
}

export interface CartItemWithProduct {
  id: string
  productId: string | null
  quantity: number
  type: CartItemType
  createdAt: Date
  accountAccess: { platform: string; email: string } | null
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

function bundleCompositionSignature(components: CartBundleComponent[], priceVbucks: number): string {
  const ids = components.map((component) => component.productId).sort().join(',')
  return `${priceVbucks}|${ids}`
}

async function findBundleConflicts(userId: string, bundle: BundleOffer): Promise<CartConflictItem[]> {
  const productIds = [...new Set(bundle.components.map((component) => component.productId))]
  if (productIds.length === 0) return []

  const items = await db.cartItem.findMany({
    where: { user_id: userId, product_id: { in: productIds }, type: { not: 'BUNDLE' } },
  })

  return items
    .filter((item): item is typeof item & { product_id: string } => Boolean(item.product_id))
    .map((item) => {
      const component = bundle.components.find((candidate) => candidate.productId === item.product_id)
      return {
        cartItemId: item.id,
        productId: item.product_id,
        name: component?.name ?? '',
        slug: component?.slug ?? '',
      }
    })
}

async function invalidateResolution(resolutionId: string) {
  await db.cartConflictResolution.updateMany({
    where: { id: resolutionId, status: 'PENDING' },
    data: { status: 'INVALIDATED' },
  })
}

function invalidResolution(message: string) {
  return {
    success: false as const,
    error: { code: 'CART_CONFLICT_RESOLUTION_INVALID', message },
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
    let accountAccess: { platform: string; email: string } | null = null
    if (item.type === 'ACCOUNT_ACCESS' && item.account_access) {
      try {
        const decrypted = JSON.parse(item.account_access as string)
        accountAccess = { platform: decrypted.platform, email: decrypted.email }
      } catch {
        accountAccess = null
      }
    }

    if (item.type === 'BUNDLE') {
      result.push({
        id: item.id,
        productId: item.product_id,
        quantity: 1,
        type: item.type,
        createdAt: item.created_at,
        accountAccess: null,
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
      accountAccess,
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

  const isAccountAccess = input.type === 'ACCOUNT_ACCESS'

  if (isAccountAccess) {
    if (!input.accountAccess) {
      return {
        success: false as const,
        error: { code: 'VALIDATION_ERROR', message: 'accountAccess es requerido para tipo ACCOUNT_ACCESS' },
      }
    }

    const existing = await db.cartItem.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: input.productId } },
    })

    if (existing) {
      return {
        success: false as const,
        error: { code: 'ITEM_ALREADY_IN_CART', message: 'Ese artículo ya está en tu carrito' },
      }
    }

    const existingAccountAccess = await db.cartItem.findFirst({
      where: { user_id: userId, type: 'ACCOUNT_ACCESS' },
    })

    if (existingAccountAccess) {
      return {
        success: false as const,
        error: { code: 'CART_TYPE_CONFLICT', message: 'Ya tienes un producto de acceso a cuenta en tu carrito' },
      }
    }

    const data: Prisma.CartItemUncheckedCreateInput = {
      user_id: userId,
      product_id: input.productId,
      quantity: 1,
      type: 'ACCOUNT_ACCESS',
      account_access: encryptCredentials(
        JSON.stringify(input.accountAccess)
      ) as unknown as Prisma.InputJsonValue,
    }

    const created = await db.cartItem.create({ data })
    return { success: true as const, data: { id: created.id, quantity: created.quantity } }
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

  const existingAccountAccessItem = await db.cartItem.findFirst({
    where: { user_id: userId, type: 'ACCOUNT_ACCESS' },
  })

  if (existingAccountAccessItem) {
    return {
      success: false as const,
      error: { code: 'CART_TYPE_CONFLICT', message: 'No puedes mezclar productos de gifting con productos de acceso a cuenta' },
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

  const conflicts = await findBundleConflicts(userId, bundle)

  if (conflicts.length > 0) {
    const resolution = await db.cartConflictResolution.create({
      data: {
        user_id: userId,
        bundle_offer_id: bundle.offerId,
        bundle_name: bundle.name,
        bundle_price_vbucks: bundle.priceVbucks,
        bundle_components: bundle.components as unknown as Prisma.InputJsonValue,
        conflicting_items: conflicts as unknown as Prisma.InputJsonValue,
        expires_at: new Date(Date.now() + CART_CONFLICT_RESOLUTION_TTL_MS),
      },
    })

    return {
      success: true as const,
      data: {
        status: 'pending_resolution' as const,
        resolutionId: resolution.id,
        expiresAt: resolution.expires_at,
        bundle: {
          offerId: bundle.offerId,
          name: bundle.name,
          imageUrl: bundle.imageUrl,
          priceVbucks: bundle.priceVbucks,
        },
        conflictingItems: conflicts,
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
    data: {
      status: 'added' as const,
      id: created.id,
      quantity: created.quantity,
      requiresManualReview,
    },
  }
}

export async function resolveCartConflict(userId: string, input: ResolveCartConflictInput) {
  const resolution = await db.cartConflictResolution.findUnique({
    where: { id: input.resolutionId },
  })

  if (!resolution || resolution.user_id !== userId) {
    return invalidResolution('La confirmación ya no es válida. Vuelve a agregar el bundle.')
  }

  if (resolution.status !== 'PENDING' || resolution.expires_at.getTime() < Date.now()) {
    return invalidResolution('La confirmación expiró o ya fue usada. Vuelve a agregar el bundle.')
  }

  if (input.decision === 'keep_separate') {
    const consumed = await db.cartConflictResolution.updateMany({
      where: { id: resolution.id, status: 'PENDING' },
      data: { status: 'KEPT_SEPARATE' },
    })

    if (consumed.count === 0) {
      return invalidResolution('La confirmación ya fue usada. Vuelve a agregar el bundle.')
    }

    return {
      success: true as const,
      data: {
        status: 'kept_separate' as const,
        resolutionId: resolution.id,
      },
    }
  }

  const bundle = await getBundleByOfferId(resolution.bundle_offer_id)

  if (!bundle || bundle.giftable === 'NOT_GIFTABLE') {
    await invalidateResolution(resolution.id)
    return invalidResolution('El bundle ya no está disponible. Revísalo e inténtalo de nuevo.')
  }

  const storedComponents = resolution.bundle_components as unknown as CartBundleComponent[]
  const compositionChanged =
    bundleCompositionSignature(storedComponents, resolution.bundle_price_vbucks) !==
    bundleCompositionSignature(bundle.components, bundle.priceVbucks)

  if (compositionChanged) {
    await invalidateResolution(resolution.id)
    return invalidResolution('La composición del bundle cambió. Revisa el pack antes de continuar.')
  }

  const conflicts = resolution.conflicting_items as unknown as CartConflictItem[]
  const conflictingItemIds = conflicts.map((conflict) => conflict.cartItemId)

  try {
    const outcome = await db.$transaction(async (tx) => {
      const consumed = await tx.cartConflictResolution.updateMany({
        where: { id: resolution.id, status: 'PENDING', expires_at: { gt: new Date() } },
        data: { status: 'REPLACED_BY_BUNDLE' },
      })

      if (consumed.count === 0) {
        return { kind: 'invalid' as const }
      }

      const alreadyInCart = await tx.cartItem.findFirst({
        where: { user_id: userId, bundle_offer_id: resolution.bundle_offer_id, product_id: null },
      })

      if (alreadyInCart) {
        await tx.cartConflictResolution.update({
          where: { id: resolution.id },
          data: { status: 'INVALIDATED' },
        })
        return { kind: 'already' as const, itemId: alreadyInCart.id }
      }

      await tx.cartItem.deleteMany({
        where: {
          id: { in: conflictingItemIds },
          user_id: userId,
          type: { not: 'BUNDLE' },
          product_id: { not: null },
        },
      })

      const created = await tx.cartItem.create({
        data: {
          user_id: userId,
          product_id: null,
          quantity: 1,
          type: 'BUNDLE',
          bundle_offer_id: resolution.bundle_offer_id,
          bundle_name: bundle.name,
          bundle_price_vbucks: bundle.priceVbucks,
          bundle_components: bundle.components as unknown as Prisma.InputJsonValue,
        },
      })

      return { kind: 'ok' as const, created }
    })

    if (outcome.kind === 'invalid') {
      return invalidResolution('La confirmación ya fue usada. Vuelve a agregar el bundle.')
    }

    if (outcome.kind === 'already') {
      return {
        success: false as const,
        error: { code: 'ITEM_ALREADY_IN_CART', message: 'Ese artículo ya está en tu carrito' },
      }
    }

    return {
      success: true as const,
      data: {
        status: 'replaced_by_bundle' as const,
        id: outcome.created.id,
        quantity: outcome.created.quantity,
        removedItemIds: conflictingItemIds,
        requiresManualReview: bundle.giftable === 'UNKNOWN',
      },
    }
  } catch (error) {
    console.error('[cart-service] replace_with_bundle fallo, carrito sin cambios:', error)
    return {
      success: false as const,
      error: {
        code: 'CART_OPERATION_FAILED',
        message: 'No se pudo completar la sustitución. Tu carrito no fue modificado.',
      },
    }
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
