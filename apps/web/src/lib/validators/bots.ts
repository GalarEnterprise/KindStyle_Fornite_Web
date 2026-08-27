import { z } from 'zod'

export const PLATFORM_LABELS: Record<string, string> = {
  EPIC: 'ID de Epic Games',
  XBOX: 'Gamertag',
  PLAYSTATION: 'PSN ID',
}

export const PlatformSchema = z.enum(['EPIC', 'XBOX', 'PLAYSTATION'])

export const RegisterPlatformSchema = z.object({
  platform: PlatformSchema,
  platform_user_id: z.string().trim().min(1).max(100),
})

export const BOT_STATUSES = [
  'ACTIVE',
  'COOLDOWN',
  'LIMITED',
  'UNAVAILABLE',
  'DISABLED',
  'ERROR',
] as const

export const BotCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  platform: PlatformSchema,
  capacity: z.number().int().min(1).max(10000).default(1000),
  daily_limit: z.number().int().min(1).max(1000).default(50),
  external_identifier: z.string().trim().max(255).optional(),
})

export const BotUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    platform: PlatformSchema.optional(),
    status: z.enum(BOT_STATUSES).optional(),
    capacity: z.number().int().min(1).max(10000).optional(),
    daily_limit: z.number().int().min(1).max(1000).optional(),
    external_identifier: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  })

export type RegisterPlatformInput = z.infer<typeof RegisterPlatformSchema>
export type BotCreateInput = z.infer<typeof BotCreateSchema>
export type BotUpdateInput = z.infer<typeof BotUpdateSchema>
