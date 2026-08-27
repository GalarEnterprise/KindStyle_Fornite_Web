import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateEligibilityAt,
  getRemainingSeconds,
  isTimerEligible,
  formatRemainingTime,
  getTimerJobKey,
  DEFAULT_FRIENDSHIP_PERIOD_HOURS,
  TIMER_QUEUE_NAME,
} from '@kindstyle/shared'

describe('Timer Service', () => {
  describe('getTimerJobKey', () => {
    it('should generate deterministic job key', () => {
      const key = getTimerJobKey('bot-123', 'request-456')
      expect(key).toBe('timer:bot-123:request-456')
    })

    it('should generate same key for same inputs', () => {
      const key1 = getTimerJobKey('bot-123', 'request-456')
      const key2 = getTimerJobKey('bot-123', 'request-456')
      expect(key1).toBe(key2)
    })
  })

  describe('TIMER_QUEUE_NAME', () => {
    it('should be timers', () => {
      expect(TIMER_QUEUE_NAME).toBe('timers')
    })
  })
  describe('calculateEligibilityAt', () => {
    it('should calculate eligibility_at with default 48h period', () => {
      const confirmedAt = new Date('2026-08-26T12:00:00Z')
      const result = calculateEligibilityAt(confirmedAt)

      expect(result).toEqual(new Date('2026-08-28T12:00:00Z'))
    })

    it('should calculate eligibility_at with custom period', () => {
      const confirmedAt = new Date('2026-08-26T12:00:00Z')
      const result = calculateEligibilityAt(confirmedAt, 24)

      expect(result).toEqual(new Date('2026-08-27T12:00:00Z'))
    })

    it('should throw error for non-positive period', () => {
      const confirmedAt = new Date('2026-08-26T12:00:00Z')

      expect(() => calculateEligibilityAt(confirmedAt, 0)).toThrow('Friendship period must be positive')
      expect(() => calculateEligibilityAt(confirmedAt, -1)).toThrow('Friendship period must be positive')
    })

    it('should use default period constant', () => {
      expect(DEFAULT_FRIENDSHIP_PERIOD_HOURS).toBe(48)
    })
  })

  describe('getRemainingSeconds', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return positive seconds when eligibility is in the future', () => {
      vi.setSystemTime(new Date('2026-08-26T12:00:00Z'))
      const eligibilityAt = new Date('2026-08-26T13:00:00Z')

      const result = getRemainingSeconds(eligibilityAt)

      expect(result).toBe(3600) // 1 hour in seconds
    })

    it('should return 0 when eligibility is in the past', () => {
      vi.setSystemTime(new Date('2026-08-26T14:00:00Z'))
      const eligibilityAt = new Date('2026-08-26T13:00:00Z')

      const result = getRemainingSeconds(eligibilityAt)

      expect(result).toBe(0)
    })

    it('should return 0 when eligibility is now', () => {
      const now = new Date('2026-08-26T12:00:00Z')
      vi.setSystemTime(now)

      const result = getRemainingSeconds(now)

      expect(result).toBe(0)
    })
  })

  describe('isTimerEligible', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true when eligibility_at is in the past', () => {
      vi.setSystemTime(new Date('2026-08-26T14:00:00Z'))
      const eligibilityAt = new Date('2026-08-26T13:00:00Z')

      expect(isTimerEligible(eligibilityAt)).toBe(true)
    })

    it('should return true when eligibility_at is now', () => {
      const now = new Date('2026-08-26T12:00:00Z')
      vi.setSystemTime(now)

      expect(isTimerEligible(now)).toBe(true)
    })

    it('should return false when eligibility_at is in the future', () => {
      vi.setSystemTime(new Date('2026-08-26T12:00:00Z'))
      const eligibilityAt = new Date('2026-08-26T13:00:00Z')

      expect(isTimerEligible(eligibilityAt)).toBe(false)
    })

    it('should return false when eligibility_at is null', () => {
      expect(isTimerEligible(null)).toBe(false)
    })
  })

  describe('formatRemainingTime', () => {
    it('should format hours and minutes', () => {
      expect(formatRemainingTime(3661)).toBe('1h 1m') // 1h 1m 1s
    })

    it('should format only minutes when less than 1 hour', () => {
      expect(formatRemainingTime(1800)).toBe('30m')
    })

    it('should return Elegible when 0 seconds', () => {
      expect(formatRemainingTime(0)).toBe('Elegible')
    })

    it('should return Elegible for negative values', () => {
      expect(formatRemainingTime(-100)).toBe('Elegible')
    })

    it('should format exactly 1 hour', () => {
      expect(formatRemainingTime(3600)).toBe('1h 0m')
    })
  })
})
