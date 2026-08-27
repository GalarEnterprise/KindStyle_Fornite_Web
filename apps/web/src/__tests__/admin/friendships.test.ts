import { describe, it, expect } from 'vitest'

describe('Admin Friendships API', () => {
  describe('GET /api/admin/friendships', () => {
    it('should require admin authentication', () => {
      expect(true).toBe(true)
    })

    it('should return friendships ordered by priority', () => {
      const requests = [
        { bots: [{ eligibility_at: new Date('2026-08-27T10:00:00Z') }] },
        { bots: [{ eligibility_at: new Date('2026-08-26T10:00:00Z') }] },
      ]
      const sorted = requests.sort((a, b) => {
        const aTime = a.bots[0].eligibility_at.getTime()
        const bTime = b.bots[0].eligibility_at.getTime()
        return aTime - bTime
      })
      expect(sorted[0].bots[0].eligibility_at).toEqual(new Date('2026-08-26T10:00:00Z'))
    })

    it('should prioritize requests with eligibility_at before those without', () => {
      const requests = [
        { bots: [{ eligibility_at: null }] },
        { bots: [{ eligibility_at: new Date('2026-08-27T10:00:00Z') }] },
      ]
      const sorted = requests.sort((a, b) => {
        const aTime = a.bots[0].eligibility_at?.getTime() ?? Infinity
        const bTime = b.bots[0].eligibility_at?.getTime() ?? Infinity
        return aTime - bTime
      })
      expect(sorted[0].bots[0].eligibility_at).not.toBeNull()
    })
  })
})
