import { describe, it, expect } from 'vitest'
import { AddToCartSchema, UpdateCartItemSchema, CredentialsSchema } from '@/lib/validators/cart'

describe('Cart Validators', () => {
   describe('AddToCartSchema', () => {
    it('acepta producto normal válido', () => {
      const result = AddToCartSchema.safeParse({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
      })
      expect(result.success).toBe(true)
    })

    it('aplica quantity default 1', () => {
      const result = AddToCartSchema.safeParse({
        productId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity).toBe(1)
    })

    it('rechaza productId inválido', () => {
      const result = AddToCartSchema.safeParse({ productId: 'no-es-uuid' })
      expect(result.success).toBe(false)
    })

    it('rechaza quantity menor a 1', () => {
      const result = AddToCartSchema.safeParse({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rechaza quantity mayor a 1', () => {
      const result = AddToCartSchema.safeParse({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      })
      expect(result.success).toBe(false)
    })

    it('producto especial sin credentials pasa validación de forma (el servicio lo rechaza)', () => {
      const result = AddToCartSchema.safeParse({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'VBucks',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('UpdateCartItemSchema', () => {
    it('acepta solo quantity', () => {
      const result = UpdateCartItemSchema.safeParse({ quantity: 1 })
      expect(result.success).toBe(true)
    })

    it('acepta solo credentials', () => {
      const result = UpdateCartItemSchema.safeParse({
        credentials: { epicEmail: 'a@b.com', epicPassword: 'pass' },
      })
      expect(result.success).toBe(true)
    })

    it('rechaza objeto vacío (nada que actualizar)', () => {
      const result = UpdateCartItemSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rechaza quantity fuera de rango', () => {
      expect(UpdateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(false)
      expect(UpdateCartItemSchema.safeParse({ quantity: 2 }).success).toBe(false)
    })
  })

  describe('CredentialsSchema', () => {
    it('acepta credenciales válidas', () => {
      const result = CredentialsSchema.safeParse({ epicEmail: 'player@epic.com', epicPassword: 'secret' })
      expect(result.success).toBe(true)
    })

    it('rechaza email de Epic inválido', () => {
      const result = CredentialsSchema.safeParse({ epicEmail: 'no-email', epicPassword: 'secret' })
      expect(result.success).toBe(false)
    })

    it('rechaza contraseña vacía', () => {
      const result = CredentialsSchema.safeParse({ epicEmail: 'player@epic.com', epicPassword: '' })
      expect(result.success).toBe(false)
    })
  })
})
