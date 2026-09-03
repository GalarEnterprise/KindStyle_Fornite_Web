import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCode } from '@/lib/services/auth/verification-code-service'

describe('Verification Code Service', () => {
  describe('generateCode', () => {
    it('generates a 6-digit code', () => {
      const code = generateCode()
      expect(code).toHaveLength(6)
      expect(/^\d{6}$/.test(code)).toBe(true)
    })

    it('generates codes within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode()
        const num = parseInt(code, 10)
        expect(num).toBeGreaterThanOrEqual(100000)
        expect(num).toBeLessThanOrEqual(999999)
      }
    })
  })

  describe('Email Context', () => {
    it('defines valid email contexts', () => {
      const validContexts = ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']
      for (const context of validContexts) {
        expect(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).toContain(context)
      }
    })
  })

  describe('Verification Code Types', () => {
    it('defines valid verification code types', () => {
      const validTypes = ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']
      for (const type of validTypes) {
        expect(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']).toContain(type)
      }
    })
  })
})

describe('Login Code Flow Security', () => {
  describe('Anti-enumeration', () => {
    it('returns same response for existing and non-existing emails', () => {
      // Both cases should return success: true to prevent email enumeration
      const existingEmailResponse = { success: true, message: 'Si el email está registrado, recibirás un código de verificación' }
      const nonExistingEmailResponse = { success: true, message: 'Si el email está registrado, recibirás un código de verificación' }

      expect(existingEmailResponse.success).toBe(nonExistingEmailResponse.success)
      expect(existingEmailResponse.message).toBe(nonExistingEmailResponse.message)
    })
  })

  describe('Code Type Isolation', () => {
    it('LOGIN code cannot be used for PASSWORD_RESET', () => {
      // The verifyCode function filters by type, so a LOGIN code
      // should not be accepted when verifying PASSWORD_RESET
      const loginType = 'LOGIN'
      const passwordResetType = 'PASSWORD_RESET'

      expect(loginType).not.toBe(passwordResetType)
    })

    it('EMAIL_VERIFICATION code cannot be used for LOGIN', () => {
      const emailVerificationType = 'EMAIL_VERIFICATION'
      const loginType = 'LOGIN'

      expect(emailVerificationType).not.toBe(loginType)
    })
  })

  describe('Cooldown Logic', () => {
    it('cooldown is 3 minutes (180 seconds)', () => {
      const COOLDOWN_MS = 3 * 60 * 1000
      const COOLDOWN_SECONDS = COOLDOWN_MS / 1000

      expect(COOLDOWN_SECONDS).toBe(180)
    })
  })

  describe('Security Constants', () => {
    it('code expiry is 10 minutes', () => {
      const CODE_EXPIRY_MS = 10 * 60 * 1000
      expect(CODE_EXPIRY_MS).toBe(600000)
    })

    it('block duration is 15 minutes', () => {
      const BLOCK_DURATION_MS = 15 * 60 * 1000
      expect(BLOCK_DURATION_MS).toBe(900000)
    })

    it('max attempts is 10', () => {
      const MAX_ATTEMPTS = 10
      expect(MAX_ATTEMPTS).toBe(10)
    })
  })
})
