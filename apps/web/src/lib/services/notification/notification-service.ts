import { Prisma } from '@prisma/client'
import { db } from '@/lib/db/client'
import { Resend } from 'resend'
import { generateWhatsAppLink } from './whatsapp-service'
import { getEmailTemplate } from '@/lib/email/templates'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type NotificationEvent =
  | 'TIMER_STARTED'
  | 'TIMER_COMPLETED'
  | 'FRIENDSHIP_CONFIRMED'
  | 'PAYMENT_VALIDATED'
  | 'PAYMENT_REJECTED'
  | 'RECEIPT_UPLOADED'
  | 'NEW_ORDER'
  | 'RECEIPT_UPLOADED_ADMIN'

interface SendNotificationInput {
  userId: string
  event: NotificationEvent
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function send(input: SendNotificationInput) {
  const prefs = await getPreferences(input.userId)

  if (prefs.web_enabled) {
    await db.notification.create({
      data: {
        user_id: input.userId,
        type: input.event,
        channel: 'WEB',
        title: input.title,
        message: input.message,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  }

  if (prefs.email_enabled && resend) {
    try {
      const template = getEmailTemplate(input.event, input.metadata)
      if (template) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@kindstyle.com',
          to: await getUserEmail(input.userId),
          subject: template.subject,
          html: template.html,
        })
      }
    } catch (error) {
      console.error('[notification-service] Email send failed:', error)
    }
  }

  if (prefs.whatsapp_enabled && input.metadata?.phone) {
    const phone = input.metadata.phone as string
    const link = generateWhatsAppLink(phone, input.event, input.metadata)
    await db.notification.create({
      data: {
        user_id: input.userId,
        type: input.event,
        channel: 'WHATSAPP',
        title: input.title,
        message: input.message,
        metadata: {
          ...input.metadata,
          whatsapp_link: link,
        } as Prisma.InputJsonValue,
      },
    })
  }
}

export async function sendToAdmin(input: Omit<SendNotificationInput, 'userId'>) {
  const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } })

  for (const admin of admins) {
    await db.notification.create({
      data: {
        user_id: admin.id,
        type: input.event,
        channel: 'WEB',
        title: input.title,
        message: input.message,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })

    if (resend) {
      try {
        const template = getEmailTemplate(input.event, input.metadata)
        if (template) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? 'noreply@kindstyle.com',
            to: admin.email,
            subject: template.subject,
            html: template.html,
          })
        }
      } catch (error) {
        console.error('[notification-service] Admin email send failed:', error)
      }
    }
  }
}

export async function markAsRead(notificationId: string) {
  await db.notification.update({
    where: { id: notificationId },
    data: { read_at: new Date() },
  })
}

export async function markAllAsRead(userId: string) {
  await db.notification.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date() },
  })
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { user_id: userId, read_at: null },
  })
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    db.notification.count({ where: { user_id: userId } }),
  ])

  return { notifications, total, page, limit }
}

export async function getPreferences(userId: string) {
  const existing = await db.notificationPreference.findUnique({
    where: { user_id: userId },
  })

  if (existing) return existing

  return db.notificationPreference.create({
    data: { user_id: userId },
  })
}

export async function updatePreferences(
  userId: string,
  prefs: { email_enabled?: boolean; web_enabled?: boolean; whatsapp_enabled?: boolean }
) {
  return db.notificationPreference.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...prefs },
    update: prefs,
  })
}

async function getUserEmail(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
  return user?.email ?? ''
}
