import { db } from '@/lib/db/client'
import type { BotStatus } from '@prisma/client'
import { BotCreateSchema, BotUpdateSchema, BOT_STATUSES } from '@/lib/validators/bots'
import { z } from 'zod'

type BotCreateData = z.infer<typeof BotCreateSchema>
type BotUpdateData = z.infer<typeof BotUpdateSchema>

export interface ServiceError {
  code: string
  message: string
}

export type BotResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError }

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['COOLDOWN', 'LIMITED', 'UNAVAILABLE', 'DISABLED', 'ERROR'],
  COOLDOWN: ['ACTIVE', 'DISABLED', 'ERROR'],
  LIMITED: ['ACTIVE', 'UNAVAILABLE', 'DISABLED', 'ERROR'],
  UNAVAILABLE: ['ACTIVE', 'LIMITED', 'DISABLED', 'ERROR'],
  DISABLED: ['ACTIVE'],
  ERROR: ['ACTIVE', 'DISABLED'],
}

export async function listBots() {
  return db.fulfillmentAccount.findMany({
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  })
}

export async function createBot(input: unknown): Promise<BotResult<unknown>> {
  const parsed = BotCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    }
  }

  const bot = await db.fulfillmentAccount.create({
    data: {
      name: parsed.data.name,
      platform: parsed.data.platform,
      capacity: parsed.data.capacity,
      daily_limit: parsed.data.daily_limit,
      external_identifier: parsed.data.external_identifier ?? null,
    },
  })

  return { success: true, data: bot }
}

export async function updateBot(id: string, input: unknown): Promise<BotResult<unknown>> {
  const parsed = BotUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    }
  }

  const existing = await db.fulfillmentAccount.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: { code: 'BOT_NOT_FOUND', message: 'Bot no encontrado' } }
  }

  if (parsed.data.status && parsed.data.status !== existing.status) {
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? []
    if (existing.status in ALLOWED_TRANSITIONS && !allowed.includes(parsed.data.status)) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Transición inválida de ${existing.status} a ${parsed.data.status}`,
        },
      }
    }
  }

  const { external_identifier, ...rest } = parsed.data
  const bot = await db.fulfillmentAccount.update({
    where: { id },
    data: { ...rest, ...(external_identifier !== undefined ? { external_identifier } : {}) },
  })

  return { success: true, data: bot }
}

export function isValidStatus(status: string): status is BotStatus {
  return (BOT_STATUSES as readonly string[]).includes(status)
}
