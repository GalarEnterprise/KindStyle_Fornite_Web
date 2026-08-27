import { Prisma, type FriendshipRequestBot, type FriendshipRequestStatus } from '@prisma/client'
import { db } from '@/lib/db/client'
import { RegisterPlatformSchema } from '@/lib/validators/bots'
import { startTimer } from '@/lib/services/timer/timer-service'

const DEFAULT_REQUIRED_BOTS = 1

export interface ServiceError {
  code: string
  message: string
}

export type FriendshipResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError }

interface AssignedBotRow extends FriendshipRequestBot {
  fulfillment_account: { id: string; name: string; platform: string }
}

type DbClient = Prisma.TransactionClient | typeof db

async function logEvent(
  client: DbClient,
  entityId: string,
  eventType: string,
  userId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await client.eventLog.create({
    data: {
      entity: 'FRIENDSHIP_REQUEST_BOT',
      entity_id: entityId,
      event_type: eventType,
      user_id: userId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  })
}

function deriveStatus(bots: FriendshipRequestBot[]): FriendshipRequestStatus {
  if (bots.length === 0) return 'CREATED'
  if (bots.every((b) => b.friendship_status === 'ACCEPTED')) return 'READY'
  if (bots.some((b) => b.friendship_status === 'ACCEPTED')) return 'PARTIALLY_READY'
  if (bots.some((b) => b.request_status === 'REQUEST_SENT')) return 'WAITING_ACCEPTANCE'
  return 'PROCESSING'
}

async function recalculateStatus(friendshipRequestId: string): Promise<void> {
  const bots = await db.friendshipRequestBot.findMany({ where: { friendship_request_id: friendshipRequestId } })
  await db.friendshipRequest.update({
    where: { id: friendshipRequestId },
    data: { status: deriveStatus(bots) },
  })
}

async function assignBotsInTx(
  tx: Prisma.TransactionClient,
  friendshipRequestId: string,
  userId: string,
  count: number
): Promise<number> {
  const available = await tx.fulfillmentAccount.findMany({
    where: {
      status: 'ACTIVE',
      current_usage: { lt: tx.fulfillmentAccount.fields.capacity },
    },
    orderBy: { current_usage: 'asc' },
    take: count,
  })

  if (available.length < count) {
    throw new NoBotsAvailableError()
  }

  for (const bot of available) {
    const row = await tx.friendshipRequestBot.create({
      data: {
        friendship_request_id: friendshipRequestId,
        fulfillment_account_id: bot.id,
      },
    })
    await tx.fulfillmentAccount.update({
      where: { id: bot.id },
      data: { current_usage: { increment: 1 } },
    })
    await logEvent(tx, row.id, 'BOT_ASSIGNED', userId, { bot_id: bot.id, bot_name: bot.name })
  }

  return available.length
}

export class NoBotsAvailableError extends Error {
  constructor() {
    super('No hay bots disponibles')
    this.name = 'NoBotsAvailableError'
  }
}

export async function registerPlatform(userId: string, input: unknown): Promise<FriendshipResult<unknown>> {
  const parsed = RegisterPlatformSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    }
  }

  const existing = await db.friendshipRequest.findFirst({
    where: { user_id: userId, status: { notIn: ['CANCELLED'] } },
  })

  if (existing) {
    return { success: true, data: existing }
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const fr = await tx.friendshipRequest.create({
        data: {
          user_id: userId,
          platform: parsed.data.platform,
          platform_user_id: parsed.data.platform_user_id,
          required_bots: DEFAULT_REQUIRED_BOTS,
        },
      })

      await assignBotsInTx(tx, fr.id, userId, DEFAULT_REQUIRED_BOTS)

      return tx.friendshipRequest.update({
        where: { id: fr.id },
        data: { status: deriveStatus(await tx.friendshipRequestBot.findMany({ where: { friendship_request_id: fr.id } })) },
      })
    })

    return { success: true, data: created }
  } catch (err) {
    if (err instanceof NoBotsAvailableError) {
      return {
        success: false,
        error: { code: 'NO_BOTS_AVAILABLE', message: 'No hay bots disponibles en este momento' },
      }
    }
    throw err
  }
}

export async function getFriendshipPanel(userId: string) {
  const fr = await db.friendshipRequest.findFirst({
    where: { user_id: userId, status: { notIn: ['CANCELLED'] } },
    include: {
      bots: {
        include: { fulfillment_account: { select: { id: true, name: true, platform: true } } },
      },
    },
  })

  if (!fr) return null

  const { bots, ...frFields } = fr
  return {
    ...frFields,
    bots: bots.map((b) => ({
      id: b.id,
      request_status: b.request_status,
      friendship_status: b.friendship_status,
      bot_name: b.fulfillment_account.name,
      bot_platform: b.fulfillment_account.platform,
      eligibility_at: b.eligibility_at,
    })),
  }
}

export async function addExtraBot(userId: string, friendshipRequestId: string): Promise<FriendshipResult<unknown>> {
  const fr = await db.friendshipRequest.findFirst({
    where: { id: friendshipRequestId, user_id: userId, status: { notIn: ['CANCELLED'] } },
    include: { bots: true },
  })

  if (!fr) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Solicitud de amistad no encontrada' } }
  }

  if (fr.bots.length >= fr.required_bots) {
    return { success: false, error: { code: 'ALREADY_COMPLETE', message: 'Ya tienes todos los bots asignados' } }
  }

  try {
    await db.$transaction(async (tx) => {
      await assignBotsInTx(tx, fr.id, userId, 1)
      await tx.friendshipRequest.update({
        where: { id: fr.id },
        data: { status: deriveStatus(await tx.friendshipRequestBot.findMany({ where: { friendship_request_id: fr.id } })) },
      })
    })
    return { success: true, data: { added: 1 } }
  } catch (err) {
    if (err instanceof NoBotsAvailableError) {
      return {
        success: false,
        error: { code: 'NO_BOTS_AVAILABLE', message: 'No hay bots disponibles en este momento' },
      }
    }
    throw err
  }
}

export async function markRequestSent(adminId: string, botRowId: string): Promise<FriendshipResult<unknown>> {
  const row = await db.friendshipRequestBot.findUnique({
    where: { id: botRowId },
    include: { friendship_request: true },
  })

  if (!row) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Asignación no encontrada' } }
  }

  if (row.request_status === 'REQUEST_SENT') {
    return { success: true, data: { alreadySent: true } }
  }

  await db.$transaction([
    db.friendshipRequestBot.update({
      where: { id: botRowId },
      data: { request_status: 'REQUEST_SENT', request_sent_at: new Date() },
    }),
    db.eventLog.create({
      data: {
        entity: 'FRIENDSHIP_REQUEST_BOT',
        entity_id: botRowId,
        event_type: 'FRIEND_REQUEST_SENT',
        user_id: adminId,
        metadata: { friendship_request_id: row.friendship_request_id } as Prisma.InputJsonValue,
      },
    }),
  ])

  await recalculateStatus(row.friendship_request_id)
  return { success: true, data: { alreadySent: false } }
}

export async function confirmFriendship(adminId: string, botRowId: string): Promise<FriendshipResult<unknown>> {
  const row = await db.friendshipRequestBot.findUnique({ where: { id: botRowId } })

  if (!row) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Asignación no encontrada' } }
  }

  if (row.request_status !== 'REQUEST_SENT') {
    return { success: false, error: { code: 'REQUEST_NOT_SENT', message: 'La solicitud de amistad no ha sido enviada' } }
  }

  if (row.friendship_status === 'ACCEPTED') {
    return { success: true, data: { alreadyConfirmed: true } }
  }

  await db.$transaction([
    db.friendshipRequestBot.update({
      where: { id: botRowId },
      data: { friendship_status: 'ACCEPTED', friendship_confirmed_at: new Date() },
    }),
    db.eventLog.create({
      data: {
        entity: 'FRIENDSHIP_REQUEST_BOT',
        entity_id: botRowId,
        event_type: 'FRIENDSHIP_CONFIRMED',
        user_id: adminId,
        metadata: { friendship_request_id: row.friendship_request_id } as Prisma.InputJsonValue,
      },
    }),
  ])

  await recalculateStatus(row.friendship_request_id)

  try {
    const friendshipRequest = await db.friendshipRequest.findUnique({
      where: { id: row.friendship_request_id },
      select: { user_id: true },
    })

    if (friendshipRequest) {
      await startTimer(botRowId, row.friendship_request_id, friendshipRequest.user_id)
    }
  } catch (error) {
    console.error('[FriendshipService] Error starting timer:', error)
  }

  return { success: true, data: { alreadyConfirmed: false } }
}

export async function listAdminQueue() {
  const requests = await db.friendshipRequest.findMany({
    where: { status: { notIn: ['CANCELLED'] } },
    include: {
      user: { select: { nickname: true } },
      bots: { select: { request_status: true, friendship_status: true } },
    },
  })

  return requests.sort((a, b) => {
    const aPending = a.bots.some((bot) => bot.request_status === 'PENDING') ? 0 : 1
    const bPending = b.bots.some((bot) => bot.request_status === 'PENDING') ? 0 : 1
    if (aPending !== bPending) return aPending - bPending
    return a.created_at.getTime() - b.created_at.getTime()
  })
}

export async function getAdminDetail(id: string) {
  const fr = await db.friendshipRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nickname: true, email: true } },
      bots: {
        include: { fulfillment_account: { select: { id: true, name: true, platform: true, external_identifier: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  })

  return fr
}
