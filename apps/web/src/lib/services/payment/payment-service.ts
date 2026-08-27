import { Prisma, type PaymentMethod, type PaymentStatus } from '@prisma/client'
import { db } from '@/lib/db/client'

export interface ServiceError {
  code: string
  message: string
}

export type PaymentResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError }

const ALLOWEDReceipt_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024 // 5MB

export async function createPayment(
  userId: string,
  requestId: string,
  method: PaymentMethod
): Promise<PaymentResult<unknown>> {
  const request = await db.request.findUnique({
    where: { id: requestId, user_id: userId },
    include: { items: true },
  })

  if (!request) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Solicitud no encontrada' } }
  }

  const existingPayment = await db.payment.findFirst({
    where: { request_id: requestId, status: { notIn: ['REJECTED'] } },
  })

  if (existingPayment) {
    return { success: false, error: { code: 'ALREADY_EXISTS', message: 'Ya existe un pago para esta solicitud' } }
  }

  const vbucksRate = await getVbucksRate()
  const totalVbucks = request.items.reduce((sum, item) => sum + item.price_vbucks_snapshot * item.quantity, 0)
  const amount = totalVbucks * vbucksRate

  const payment = await db.payment.create({
    data: {
      request_id: requestId,
      user_id: userId,
      method,
      amount,
      status: 'PENDING_RECEIPT',
    },
  })

  return { success: true, data: payment }
}

export async function uploadReceipt(
  paymentId: string,
  userId: string,
  file: File
): Promise<PaymentResult<{ receiptUrl: string }>> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId, user_id: userId },
  })

  if (!payment) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } }
  }

  if (payment.status !== 'PENDING_RECEIPT') {
    return { success: false, error: { code: 'INVALID_STATUS', message: 'El pago no está en estado pendiente' } }
  }

  if (!ALLOWEDReceipt_TYPES.includes(file.type)) {
    return {
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'Formato no válido. Use JPG, PNG o WEBP' },
    }
  }

  if (file.size > MAX_RECEIPT_SIZE) {
    return {
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'El archivo excede 5MB' },
    }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const fileName = `${paymentId}-${Date.now()}.${file.type.split('/')[1]}`
  const filePath = `uploads/receipts/${fileName}`

  const fs = await import('fs/promises')
  const path = await import('path')

  const fullPath = path.join(process.cwd(), filePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, buffer)

  await db.payment.update({
    where: { id: paymentId },
    data: {
      receipt_file_url: `/${filePath}`,
      receipt_file_name: file.name,
      status: 'VALIDATION_IN_PROGRESS',
    },
  })

  await db.eventLog.create({
    data: {
      entity: 'PAYMENT',
      entity_id: paymentId,
      event_type: 'RECEIPT_UPLOADED',
      user_id: userId,
      metadata: {
        file_name: file.name,
        file_size: file.size,
      } as Prisma.InputJsonValue,
    },
  })

  await db.notification.create({
    data: {
      user_id: userId,
      type: 'RECEIPT_UPLOADED',
      channel: 'WEB',
      title: 'Comprobante recibido',
      message: 'Comprobante recibido. Validación en proceso.',
      metadata: {
        payment_id: paymentId,
      } as Prisma.InputJsonValue,
    },
  })

  return { success: true, data: { receiptUrl: `/${filePath}` } }
}

export async function validatePayment(
  paymentId: string,
  adminId: string
): Promise<PaymentResult<unknown>> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { request: { select: { request_number: true } } },
  })

  if (!payment) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } }
  }

  if (payment.status !== 'VALIDATION_IN_PROGRESS') {
    return { success: false, error: { code: 'INVALID_STATUS', message: 'El pago no está en revisión' } }
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'VALIDATED',
      validated_by: adminId,
      validated_at: new Date(),
    },
  })

  await db.eventLog.create({
    data: {
      entity: 'PAYMENT',
      entity_id: paymentId,
      event_type: 'PAYMENT_VALIDATED',
      user_id: adminId,
      metadata: {
        request_number: payment.request.request_number,
      } as Prisma.InputJsonValue,
    },
  })

  await db.notification.create({
    data: {
      user_id: payment.user_id,
      type: 'PAYMENT_VALIDATED',
      channel: 'WEB',
      title: 'Pago confirmado',
      message: `Pago de $${payment.amount} MXN confirmado para solicitud ${payment.request.request_number}`,
      metadata: {
        payment_id: paymentId,
        amount: payment.amount.toString(),
      } as Prisma.InputJsonValue,
    },
  })

  return { success: true, data: { validated: true } }
}

export async function rejectPayment(
  paymentId: string,
  adminId: string,
  reason: string
): Promise<PaymentResult<unknown>> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { request: { select: { request_number: true } } },
  })

  if (!payment) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } }
  }

  if (payment.status !== 'VALIDATION_IN_PROGRESS') {
    return { success: false, error: { code: 'INVALID_STATUS', message: 'El pago no está en revisión' } }
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      admin_notes: reason,
      validated_by: adminId,
      validated_at: new Date(),
    },
  })

  await db.eventLog.create({
    data: {
      entity: 'PAYMENT',
      entity_id: paymentId,
      event_type: 'PAYMENT_REJECTED',
      user_id: adminId,
      metadata: {
        request_number: payment.request.request_number,
        reason,
      } as Prisma.InputJsonValue,
    },
  })

  await db.notification.create({
    data: {
      user_id: payment.user_id,
      type: 'PAYMENT_REJECTED',
      channel: 'WEB',
      title: 'Pago no válido',
      message: `Pago rechazado: ${reason}`,
      metadata: {
        payment_id: paymentId,
        reason,
      } as Prisma.InputJsonValue,
    },
  })

  return { success: true, data: { rejected: true } }
}

export async function getUserPayments(userId: string) {
  return db.payment.findMany({
    where: { user_id: userId },
    include: {
      request: {
        include: {
          items: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function getAdminPayments(status?: PaymentStatus) {
  return db.payment.findMany({
    where: status ? { status } : {},
    include: {
      request: {
        include: {
          user: { select: { id: true, nickname: true, email: true } },
          items: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })
}

async function getVbucksRate(): Promise<number> {
  const setting = await db.currencySetting.findFirst()
  return setting ? Number(setting.vbucks_rate_mxn) : 7.5
}
