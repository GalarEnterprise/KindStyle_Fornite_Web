import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateEligibilityAt,
  getRemainingSeconds,
  isTimerEligible,
  formatRemainingTime,
  getTimerJobKey,
  DEFAULT_FRIENDSHIP_PERIOD_HOURS,
} from '@kindstyle/shared'

describe('Timer Lifecycle Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should calculate eligibility correctly from friendship confirmation', () => {
    const confirmedAt = new Date('2026-08-26T12:00:00Z')
    const eligibilityAt = calculateEligibilityAt(confirmedAt)

    expect(eligibilityAt).toEqual(new Date('2026-08-28T12:00:00Z'))
  })

  it('should track remaining time accurately', () => {
    vi.setSystemTime(new Date('2026-08-26T12:00:00Z'))
    const eligibilityAt = new Date('2026-08-26T14:00:00Z')

    const remaining = getRemainingSeconds(eligibilityAt)
    expect(remaining).toBe(7200) // 2 hours in seconds
  })

  it('should determine eligibility correctly', () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:01Z'))
    const eligibilityAt = new Date('2026-08-28T12:00:00Z')

    expect(isTimerEligible(eligibilityAt)).toBe(true)
  })

  it('should format time correctly for display', () => {
    expect(formatRemainingTime(3661)).toBe('1h 1m')
    expect(formatRemainingTime(1800)).toBe('30m')
    expect(formatRemainingTime(0)).toBe('Elegible')
  })

  it('should generate consistent job keys for same bot-request pair', () => {
    const key1 = getTimerJobKey('bot-123', 'request-456')
    const key2 = getTimerJobKey('bot-123', 'request-456')

    expect(key1).toBe(key2)
    expect(key1).toBe('timer:bot-123:request-456')
  })

  it('should generate different keys for different bots', () => {
    const key1 = getTimerJobKey('bot-123', 'request-456')
    const key2 = getTimerJobKey('bot-789', 'request-456')

    expect(key1).not.toBe(key2)
  })

  it('should handle timer countdown simulation', () => {
    const confirmedAt = new Date('2026-08-26T12:00:00Z')
    const eligibilityAt = calculateEligibilityAt(confirmedAt)

    vi.setSystemTime(new Date('2026-08-26T12:00:00Z'))
    expect(isTimerEligible(eligibilityAt)).toBe(false)

    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    expect(isTimerEligible(eligibilityAt)).toBe(true)
  })

  it('should use configurable friendship period', () => {
    const confirmedAt = new Date('2026-08-26T12:00:00Z')
    const eligibilityAt24h = calculateEligibilityAt(confirmedAt, 24)
    const eligibilityAt48h = calculateEligibilityAt(confirmedAt, 48)

    expect(eligibilityAt24h).toEqual(new Date('2026-08-27T12:00:00Z'))
    expect(eligibilityAt48h).toEqual(new Date('2026-08-28T12:00:00Z'))
  })

  it('should handle edge case: timer completes exactly now', () => {
    const now = new Date('2026-08-26T12:00:00Z')
    vi.setSystemTime(now)

    expect(isTimerEligible(now)).toBe(true)
    expect(getRemainingSeconds(now)).toBe(0)
    expect(formatRemainingTime(0)).toBe('Elegible')
  })
})
