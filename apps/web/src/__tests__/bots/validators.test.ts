import { describe, it, expect } from 'vitest'
import {
  PLATFORM_LABELS,
  PlatformSchema,
  RegisterPlatformSchema,
  BotCreateSchema,
  BotUpdateSchema,
} from '@/lib/validators/bots'

describe('RegisterPlatformSchema', () => {
  it('acepta plataforma e ID válidos', () => {
    const result = RegisterPlatformSchema.safeParse({
      platform: 'EPIC',
      platform_user_id: 'Pablito123',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza plataforma inválida', () => {
    const result = RegisterPlatformSchema.safeParse({
      platform: 'STEAM',
      platform_user_id: 'x',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza ID vacío o demasiado largo', () => {
    expect(
      RegisterPlatformSchema.safeParse({ platform: 'XBOX', platform_user_id: '' }).success
    ).toBe(false)
    expect(
      RegisterPlatformSchema.safeParse({ platform: 'XBOX', platform_user_id: 'a'.repeat(101) })
        .success
    ).toBe(false)
  })
})

describe('BotCreateSchema', () => {
  it('aplica defaults de capacity y daily_limit', () => {
    const result = BotCreateSchema.parse({ name: 'KindStyle 1', platform: 'EPIC' })
    expect(result.capacity).toBe(1000)
    expect(result.daily_limit).toBe(50)
  })

  it('rechaza capacity fuera de rango', () => {
    expect(
      BotCreateSchema.safeParse({ name: 'B', platform: 'EPIC', capacity: 0 }).success
    ).toBe(false)
  })
})

describe('BotUpdateSchema', () => {
  it('acepta actualización parcial con status válido', () => {
    expect(BotUpdateSchema.safeParse({ status: 'COOLDOWN' }).success).toBe(true)
  })

  it('rechaza objeto vacío', () => {
    expect(BotUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('rechaza status inválido', () => {
    expect(BotUpdateSchema.safeParse({ status: 'ON_FIRE' }).success).toBe(false)
  })
})

describe('PLATFORM_LABELS', () => {
  it('tiene label por cada plataforma', () => {
    for (const p of PlatformSchema.options) {
      expect(PLATFORM_LABELS[p]).toBeTruthy()
    }
  })
})
