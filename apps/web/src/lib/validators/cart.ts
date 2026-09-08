import { z } from 'zod'

export const SPECIAL_TYPES = ['VBucks', 'CREW', 'BATTLE_PASS'] as const
export type SpecialCartType = (typeof SPECIAL_TYPES)[number]

export const PLATFORMS = ['epic', 'xbox', 'psn', 'fb', 'google', 'nintendo', 'lego'] as const
export type Platform = (typeof PLATFORMS)[number]

export const CredentialsSchema = z.object({
  epicEmail: z.string().email('Email de Epic inválido'),
  epicPassword: z.string().min(1, 'Contraseña de Epic es requerida'),
})

export const AccountAccessSchema = z.object({
  platform: z.enum(PLATFORMS, { errorMap: () => ({ message: 'Plataforma inválida' }) }),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
})

export const AddToCartSchema = z
  .object({
    productId: z.string().uuid('productId debe ser un UUID válido').optional(),
    offerId: z.string().min(1, 'offerId es requerido').optional(),
    quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(1, 'La cantidad máxima es 1').default(1),
    type: z.enum(['GIFT', 'ACCOUNT_ACCESS']).default('GIFT').optional(),
    credentials: CredentialsSchema.optional(),
    accountAccess: AccountAccessSchema.optional(),
  })
  .refine((data) => Boolean(data.productId) !== Boolean(data.offerId), {
    message: 'Debe proporcionar productId o offerId, no ambos ni ninguno',
    path: ['productId'],
  })
  .refine(
    (data) => {
      if (data.type === 'ACCOUNT_ACCESS') {
        return data.accountAccess !== undefined
      }
      return true
    },
    {
      message: 'accountAccess es requerido para tipo ACCOUNT_ACCESS',
      path: ['accountAccess'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'GIFT') {
        return data.accountAccess === undefined
      }
      return true
    },
    {
      message: 'accountAccess no debe proporcionarse para tipo GIFT',
      path: ['accountAccess'],
    }
  )

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(1, 'La cantidad máxima es 1').optional(),
  credentials: CredentialsSchema.optional(),
}).refine((data) => data.quantity !== undefined || data.credentials !== undefined, {
  message: 'Debe proporcionar quantity o credentials',
})

export const CART_CONFLICT_DECISIONS = ['keep_separate', 'replace_with_bundle'] as const

export const ResolveCartConflictSchema = z.object({
  resolutionId: z.string().uuid('resolutionId debe ser un UUID válido'),
  decision: z.enum(CART_CONFLICT_DECISIONS, {
    errorMap: () => ({ message: 'decision debe ser keep_separate o replace_with_bundle' }),
  }),
})

export type CredentialsInput = z.infer<typeof CredentialsSchema>
export type AccountAccessInput = z.infer<typeof AccountAccessSchema>
export type AddToCartInput = z.infer<typeof AddToCartSchema>
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>
export type CartConflictDecision = z.infer<typeof ResolveCartConflictSchema>['decision']
export type ResolveCartConflictInput = z.infer<typeof ResolveCartConflictSchema>
