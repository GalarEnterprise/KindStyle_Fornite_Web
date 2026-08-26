import { z } from 'zod'

export const SPECIAL_TYPES = ['VBucks', 'CREW', 'BATTLE_PASS'] as const
export type SpecialCartType = (typeof SPECIAL_TYPES)[number]

export const CredentialsSchema = z.object({
  epicEmail: z.string().email('Email de Epic inválido'),
  epicPassword: z.string().min(1, 'Contraseña de Epic es requerida'),
})

export const AddToCartSchema = z.object({
  productId: z.string().uuid('productId debe ser un UUID válido'),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(10, 'La cantidad máxima es 10').default(1),
  credentials: CredentialsSchema.optional(),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(10, 'La cantidad máxima es 10').optional(),
  credentials: CredentialsSchema.optional(),
}).refine((data) => data.quantity !== undefined || data.credentials !== undefined, {
  message: 'Debe proporcionar quantity o credentials',
})

export type CredentialsInput = z.infer<typeof CredentialsSchema>
export type AddToCartInput = z.infer<typeof AddToCartSchema>
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>
