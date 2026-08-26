import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterSchema, VerifyCodeSchema, LoginSchema, CreatePasswordSchema, NicknameSchema } from '@/lib/validators/auth'

describe('Auth Validators', () => {
  describe('RegisterSchema', () => {
    it('validates valid email', () => {
      const result = RegisterSchema.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = RegisterSchema.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('rejects missing email', () => {
      const result = RegisterSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('VerifyCodeSchema', () => {
    it('validates valid code', () => {
      const result = VerifyCodeSchema.safeParse({ email: 'test@example.com', code: '123456' })
      expect(result.success).toBe(true)
    })

    it('rejects code with wrong length', () => {
      const result = VerifyCodeSchema.safeParse({ email: 'test@example.com', code: '12345' })
      expect(result.success).toBe(false)
    })

    it('rejects code with non-numeric characters', () => {
      const result = VerifyCodeSchema.safeParse({ email: 'test@example.com', code: '123abc' })
      expect(result.success).toBe(false)
    })
  })

  describe('LoginSchema', () => {
    it('validates code method', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', method: 'code', code: '123456' })
      expect(result.success).toBe(true)
    })

    it('validates password method', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', method: 'password', password: 'secret123' })
      expect(result.success).toBe(true)
    })

    it('rejects code method without code', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', method: 'code' })
      expect(result.success).toBe(false)
    })

    it('rejects password method without password', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', method: 'password' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid method', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', method: 'invalid' })
      expect(result.success).toBe(false)
    })
  })

  describe('CreatePasswordSchema', () => {
    it('validates valid password', () => {
      const result = CreatePasswordSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
        confirmPassword: 'securepass123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects short password', () => {
      const result = CreatePasswordSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
      })
      expect(result.success).toBe(false)
    })

    it('rejects mismatched passwords', () => {
      const result = CreatePasswordSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
        confirmPassword: 'different',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password similar to email', () => {
      const result = CreatePasswordSchema.safeParse({
        email: 'test@example.com',
        password: 'test@example.com123',
        confirmPassword: 'test@example.com123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('NicknameSchema', () => {
    it('validates valid nickname', () => {
      const result = NicknameSchema.safeParse({ nickname: 'PlayerOne' })
      expect(result.success).toBe(true)
    })

    it('rejects nickname too short', () => {
      const result = NicknameSchema.safeParse({ nickname: 'ab' })
      expect(result.success).toBe(false)
    })

    it('rejects nickname too long', () => {
      const result = NicknameSchema.safeParse({ nickname: 'a'.repeat(21) })
      expect(result.success).toBe(false)
    })

    it('rejects nickname with special characters', () => {
      const result = NicknameSchema.safeParse({ nickname: 'Player One!' })
      expect(result.success).toBe(false)
    })

    it('accepts nickname with underscores', () => {
      const result = NicknameSchema.safeParse({ nickname: 'Player_One' })
      expect(result.success).toBe(true)
    })
  })
})

describe('Token Service', () => {
  it('generates and verifies access token', async () => {
    const { generateAccessToken, verifyToken } = await import('@/lib/services/auth/token-service')
    const token = await generateAccessToken('user-123', 'USER', 'TestUser')
    expect(token).toBeDefined()
    expect(token.length).toBeGreaterThan(0)

    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe('user-123')
    expect(payload?.role).toBe('USER')
    expect(payload?.nickname).toBe('TestUser')
  })

  it('generates and verifies refresh token', async () => {
    const { generateRefreshToken, verifyRefreshToken } = await import('@/lib/services/auth/token-service')
    const token = await generateRefreshToken('user-123')
    expect(token).toBeDefined()

    const payload = await verifyRefreshToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe('user-123')
  })

  it('rejects invalid token', async () => {
    const { verifyToken } = await import('@/lib/services/auth/token-service')
    const payload = await verifyToken('invalid-token')
    expect(payload).toBeNull()
  })

  it('generates token pair', async () => {
    const { generateTokenPair } = await import('@/lib/services/auth/token-service')
    const pair = await generateTokenPair('user-123', 'USER')
    expect(pair.accessToken).toBeDefined()
    expect(pair.refreshToken).toBeDefined()
  })
})
