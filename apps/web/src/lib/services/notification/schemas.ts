import { z } from 'zod'

export const NotificationEventSchema = z.enum([
  'TIMER_STARTED',
  'TIMER_COMPLETED',
  'FRIENDSHIP_CONFIRMED',
  'PAYMENT_VALIDATED',
  'PAYMENT_REJECTED',
  'RECEIPT_UPLOADED',
  'NEW_ORDER',
  'RECEIPT_UPLOADED_ADMIN',
])

export const SendNotificationSchema = z.object({
  userId: z.string().uuid(),
  event: NotificationEventSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
})

export const UpdatePreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  web_enabled: z.boolean().optional(),
  whatsapp_enabled: z.boolean().optional(),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})
