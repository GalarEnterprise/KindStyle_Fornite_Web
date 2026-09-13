import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculatePriceMxn, getVbucksRate, resetCache } from '@/lib/services/catalog/price-service'

vi.mock('@/lib/db/client', () => ({
  db: {
    currencySetting: {
      findFirst: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db/client'

const mockDb = db as unknown as { currencySetting: { findFirst: ReturnType<typeof vi.fn> } }

describe('price-service', () => {
  beforeEach(() => {
    resetCache()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getVbucksRate', () => {
    it('returns default rate when CurrencySetting is empty', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue(null)

      const rate = await getVbucksRate()

      expect(rate).toBe(7.5)
    })

    it('returns rate from database when CurrencySetting exists', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue({
        vbucks_rate_mxn: 8.0,
      } as any)

      const rate = await getVbucksRate()

      expect(rate).toBe(8.0)
    })

    it('caches the rate for subsequent calls', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue({
        vbucks_rate_mxn: 9.0,
      } as any)

      const rate1 = await getVbucksRate()
      const rate2 = await getVbucksRate()

      expect(rate1).toBe(9.0)
      expect(rate2).toBe(9.0)
      expect(mockDb.currencySetting.findFirst).toHaveBeenCalledTimes(1)
    })

    it('returns default rate on database error', async () => {
      mockDb.currencySetting.findFirst.mockRejectedValue(new Error('DB error'))

      const rate = await getVbucksRate()

      expect(rate).toBe(7.5)
    })
  })

  describe('calculatePriceMxn', () => {
    it('calculates MXN price correctly with default rate', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue(null)

      const price = await calculatePriceMxn(1000)

      expect(price).toBe(75)
    })

    it('calculates MXN price correctly with custom rate', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue({
        vbucks_rate_mxn: 10.0,
      } as any)

      const price = await calculatePriceMxn(1000)

      expect(price).toBe(100)
    })

    it('returns 0 for 0 V-Bucks', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue(null)

      const price = await calculatePriceMxn(0)

      expect(price).toBe(0)
    })

    it('handles decimal V-Bucks correctly', async () => {
      mockDb.currencySetting.findFirst.mockResolvedValue({
        vbucks_rate_mxn: 7.5,
      } as any)

      const price = await calculatePriceMxn(150)

      expect(price).toBeCloseTo(11.25)
    })
  })
})
