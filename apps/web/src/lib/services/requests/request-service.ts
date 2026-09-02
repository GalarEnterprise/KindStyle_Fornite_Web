import { Prisma } from '@prisma/client'
import { db } from '@/lib/db/client'
import { buildRequestMessage, buildWhatsappUrl, type RequestMessageData } from '@/lib/services/requests/message-service'
import { createPayment } from '@/lib/services/payment/payment-service'
import { sendToAdmin } from '@/lib/services/notification/notification-service'

const DEFAULT_VBUCKS_RATE = 7.5
const MAX_NUMBER_RETRIES = 5

interface CartBundleComponent {
  productId: string
  name: string
  slug: string
}

export interface RequestSummary {
  id: string
  requestNumber: string
  status: string
  totalVbucks: number
  totalMxn: number
  whatsappOpenedAt: Date | null
  createdAt: Date
}

export interface RequestDetail extends RequestSummary {
  paymentMethod: 'TRANSFER' | 'OXXO'
  items: Array<{
    id: string
    productName: string
    sku: string
    priceVbucks: number
    quantity: number
  }>
}

async function getVbucksRate(tx: Prisma.TransactionClient | typeof db): Promise<number> {
  const setting = await tx.currencySetting.findFirst()
  return setting ? Number(setting.vbucks_rate_mxn) : DEFAULT_VBUCKS_RATE
}

function padSeq(seq: number): string {
  return String(seq).padStart(4, '0')
}

export async function generateRequestNumber(
  tx: Prisma.TransactionClient,
  date = new Date()
): Promise<string> {
  const dateStr = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('')

  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    const countToday = await tx.request.count({
      where: { created_at: { gte: startOfDay, lt: endOfDay } },
    })
    const candidate = `REQ-${dateStr}-${padSeq(countToday + 1 + attempt)}`

    const existing = await tx.request.findUnique({ where: { request_number: candidate } })
    if (!existing) return candidate
  }

  throw new Error('No se pudo generar un número de solicitud único tras varios intentos')
}

export async function createRequestFromCart(userId: string, paymentMethod: 'TRANSFER' | 'OXXO' = 'TRANSFER') {
  const user = await db.user.findUnique({ where: { id: userId }, select: { nickname: true } })

  if (!user?.nickname) {
    return {
      success: false as const,
      error: {
        code: 'NICKNAME_REQUIRED',
        message: 'Debes configurar tu apodo antes de solicitar productos',
      },
    }
  }

  const cartItems = await db.cartItem.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  })

  if (cartItems.length === 0) {
    return {
      success: false as const,
      error: { code: 'CART_EMPTY', message: 'Tu carrito está vacío' },
    }
  }

  const products = await db.product.findMany({
    where: { id: { in: cartItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)) } },
  })
  const productsById = new Map(products.map((product) => [product.id, product]))

  for (const item of cartItems) {
    if (item.type === 'BUNDLE') continue

    const product = productsById.get(item.product_id ?? '')
    if (!product || !product.active || !product.visible) {
      return {
        success: false as const,
        error: {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Un producto de tu carrito ya no está disponible. Revisa tu carrito.',
        },
      }
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const rate = await getVbucksRate(tx)
      const requestNumber = await generateRequestNumber(tx)

      const totalVbucks = cartItems.reduce((acc, item) => {
        if (item.type === 'BUNDLE') {
          return acc + (item.bundle_price_vbucks ?? 0) * item.quantity
        }
        const product = productsById.get(item.product_id ?? '')
        return acc + (product?.price_vbucks ?? 0) * item.quantity
      }, 0)
      const totalMxn = totalVbucks * (rate / 100)

      const request = await tx.request.create({
        data: {
          request_number: requestNumber,
          user_id: userId,
          status: 'CREATED',
          total_vbucks: totalVbucks,
          total_mxn: new Prisma.Decimal(totalMxn.toFixed(2)),
        },
      })

      const requestItems: Prisma.RequestItemCreateManyInput[] = []
      for (const item of cartItems) {
        if (item.type === 'BUNDLE') {
          const components = (item.bundle_components ?? []) as unknown as CartBundleComponent[]
          for (const component of components) {
            const product = productsById.get(component.productId)
            if (!product) continue
            requestItems.push({
              request_id: request.id,
              product_id: product.id,
              sku: product.internal_sku,
              product_name_snapshot: product.name,
              fortnite_product_id: product.fortnite_product_id,
              fortnite_offer_id: product.fortnite_offer_id ?? item.bundle_offer_id ?? undefined,
              price_vbucks_snapshot: product.price_vbucks,
              quantity: item.quantity,
              fulfillment_type: 'bundle',
            })
          }
          continue
        }

        const product = productsById.get(item.product_id ?? '')
        if (!product) continue
        requestItems.push({
          request_id: request.id,
          product_id: product.id,
          sku: product.internal_sku,
          product_name_snapshot: product.name,
          fortnite_product_id: product.fortnite_product_id,
          fortnite_offer_id: product.fortnite_offer_id ?? undefined,
          price_vbucks_snapshot: product.price_vbucks,
          quantity: item.quantity,
        })
      }

      await tx.requestItem.createMany({
        data: requestItems,
      })

      await tx.cartItem.deleteMany({ where: { user_id: userId } })

      return request
    })

    const detail = await getRequestById(userId, result.id)
    if (!detail) {
      return {
        success: false as const,
        error: { code: 'INTERNAL_ERROR', message: 'Error al recuperar la solicitud creada' },
      }
    }

    try {
      await createPayment(userId, result.id, paymentMethod)
    } catch (error) {
      console.error('[request-service.createRequestFromCart] Error creating payment:', error)
    }

    try {
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
      await sendToAdmin({
        event: 'NEW_ORDER',
        title: 'Nuevo pedido',
        message: `Nuevo pedido ${result.request_number} de ${user?.email ?? 'cliente'}`,
        metadata: {
          request_number: result.request_number,
          user_email: user?.email,
          total_mxn: result.total_mxn.toString(),
        },
      })
    } catch (error) {
      console.error('[request-service.createRequestFromCart] Error sending admin notification:', error)
    }

    return { success: true as const, data: detail }
  } catch (error) {
    console.error('[request-service.createRequestFromCart] Error:', error)
    return {
      success: false as const,
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    }
  }
}

function toSummary(request: {
  id: string
  request_number: string
  status: string
  total_vbucks: number
  total_mxn: bigint | number | Prisma.Decimal
  whatsapp_opened_at: Date | null
  created_at: Date
}): RequestSummary {
  return {
    id: request.id,
    requestNumber: request.request_number,
    status: request.status,
    totalVbucks: request.total_vbucks,
    totalMxn: Number(request.total_mxn),
    whatsappOpenedAt: request.whatsapp_opened_at,
    createdAt: request.created_at,
  }
}

export async function getUserRequests(userId: string): Promise<RequestSummary[]> {
  const requests = await db.request.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  })
  return requests.map(toSummary)
}

export async function getRequestById(userId: string, requestId: string): Promise<RequestDetail | null> {
  const request = await db.request.findFirst({
    where: { id: requestId, user_id: userId },
    include: { items: true, payments: { take: 1, orderBy: { created_at: 'desc' } } },
  })

  if (!request) return null

  return {
    ...toSummary(request),
    paymentMethod: request.payments[0]?.method ?? 'TRANSFER',
    items: request.items.map((item) => ({
      id: item.id,
      productName: item.product_name_snapshot,
      sku: item.sku,
      priceVbucks: item.price_vbucks_snapshot,
      quantity: item.quantity,
    })),
  }
}

export async function deleteRequest(userId: string, requestId: string) {
  const request = await db.request.findFirst({
    where: { id: requestId, user_id: userId },
  })

  if (!request) {
    return {
      success: false as const,
      error: { code: 'REQUEST_NOT_FOUND', message: 'La solicitud no existe' },
    }
  }

  await db.request.delete({
    where: { id: requestId },
  })

  return { success: true as const, data: { id: requestId } }
}

export async function markWhatsappOpened(userId: string, requestId: string) {
  const request = await db.request.findFirst({
    where: { id: requestId, user_id: userId },
  })

  if (!request) {
    return {
      success: false as const,
      error: { code: 'REQUEST_NOT_FOUND', message: 'La solicitud no existe' },
    }
  }

  if (request.whatsapp_opened_at) {
    return { success: true as const, data: { alreadyOpened: true } }
  }

  await db.request.update({
    where: { id: requestId },
    data: {
      whatsapp_opened_at: new Date(),
      ...(request.status === 'CREATED' ? { status: 'WHATSAPP_OPENED' } : {}),
    },
  })

  return { success: true as const, data: { alreadyOpened: false } }
}

export function buildMessageForRequest(detail: RequestDetail, nickname: string) {
  const messageData: RequestMessageData = {
    requestNumber: detail.requestNumber,
    nickname,
    items: detail.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      priceVbucks: item.priceVbucks,
    })),
    totalVbucks: detail.totalVbucks,
    totalMxn: detail.totalMxn,
  }

  const message = buildRequestMessage(messageData)
  return { message, whatsappUrl: buildWhatsappUrl(message) }
}
