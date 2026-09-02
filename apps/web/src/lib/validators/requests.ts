import { z } from 'zod'

export const CreateRequestSchema = z.object({
  note: z.string().max(500, 'La nota no puede exceder 500 caracteres').optional(),
  paymentMethod: z.enum(['TRANSFER', 'OXXO']).default('TRANSFER'),
})

export const RequestIdSchema = z.object({
  id: z.string().uuid('El identificador de la solicitud no es válido'),
})

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>
