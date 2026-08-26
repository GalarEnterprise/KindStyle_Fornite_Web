import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const VerifyCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/, 'El código solo puede contener números'),
})

export const LoginSchema = z
  .object({
    email: z.string().email('Email inválido'),
    method: z.enum(['code', 'password']),
    code: z.string().length(6).regex(/^\d{6}$/).optional(),
    password: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'code' && !data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'Código es requerido cuando el método es code',
      })
    }
    if (data.method === 'password' && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Contraseña es requerida cuando el método es password',
      })
    }
  })

const passwordBase = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
})

export const CreatePasswordSchema = passwordBase.superRefine((data, ctx) => {
  const emailLocalPart = data.email.split('@')[0]?.toLowerCase() ?? ''
  if (emailLocalPart && data.password.toLowerCase().includes(emailLocalPart)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'La contraseña no debe ser similar al email',
    })
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Las contraseñas no coinciden',
    })
  }
})

export const NicknameSchema = z.object({
  nickname: z.string()
    .min(3, 'El apodo debe tener al menos 3 caracteres')
    .max(20, 'El apodo no puede tener más de 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El apodo solo puede contener letras, números y guiones bajos'),
})

export const EmailSchema = z.object({
  email: z.string().email('Email inválido'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreatePasswordInput = z.infer<typeof CreatePasswordSchema>
export type NicknameInput = z.infer<typeof NicknameSchema>
export type EmailInput = z.infer<typeof EmailSchema>
