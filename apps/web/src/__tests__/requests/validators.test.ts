import { describe, it, expect } from 'vitest'
import { CreateRequestSchema, RequestIdSchema } from '@/lib/validators/requests'

describe('Request Validators', () => {
  describe('CreateRequestSchema', () => {
    it('acepta objeto vacío', () => {
      expect(CreateRequestSchema.safeParse({}).success).toBe(true)
    })

    it('acepta nota opcional', () => {
      const result = CreateRequestSchema.safeParse({ note: 'Sin reembolsos' })
      expect(result.success).toBe(true)
    })

    it('rechaza nota demasiado larga', () => {
      const result = CreateRequestSchema.safeParse({ note: 'a'.repeat(501) })
      expect(result.success).toBe(false)
    })
  })

  describe('RequestIdSchema', () => {
    it('acepta uuid válido', () => {
      const result = RequestIdSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' })
      expect(result.success).toBe(true)
    })

    it('rechaza id inválido', () => {
      expect(RequestIdSchema.safeParse({ id: 'no-uuid' }).success).toBe(false)
    })
  })
})
