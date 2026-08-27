import { db } from '@/lib/db/client'
import { z } from 'zod'

export const SettingsSchema = z.object({
  vbucks_price_mxn: z.number().positive().optional(),
  friendship_period_hours: z.number().int().positive().optional(),
  max_concurrent_sessions: z.number().int().positive().optional(),
  maintenance_mode: z.boolean().optional(),
  whatsapp_number: z.string().optional(),
  email_from: z.string().email().optional(),
})

export type Settings = z.infer<typeof SettingsSchema>

const DEFAULT_SETTINGS: Record<string, string> = {
  vbucks_price_mxn: '7.5',
  friendship_period_hours: '48',
  max_concurrent_sessions: '2',
  maintenance_mode: 'false',
  whatsapp_number: '+523191033181',
  email_from: 'noreply@kindstyle.com',
}

export async function getSettings(): Promise<Record<string, string>> {
  const settings = await db.systemSetting.findMany()
  const result: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const s of settings) {
    result[s.key] = s.value
  }
  return result
}

export async function updateSettings(input: Settings): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  const parsed = SettingsSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }
  }

  const updates = parsed.data
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    await db.systemSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  }

  return { success: true }
}
