export const DEFAULT_FRIENDSHIP_PERIOD_HOURS = 48
export const TIMER_QUEUE_NAME = 'timers'

export function getTimerJobKey(botId: string, requestId: string): string {
  return `timer:${botId}:${requestId}`
}

export function calculateEligibilityAt(
  friendshipConfirmedAt: Date,
  periodHours: number = DEFAULT_FRIENDSHIP_PERIOD_HOURS
): Date {
  if (periodHours <= 0) {
    throw new Error('Friendship period must be positive')
  }

  const eligibilityAt = new Date(friendshipConfirmedAt)
  eligibilityAt.setHours(eligibilityAt.getHours() + periodHours)
  return eligibilityAt
}

export function getRemainingSeconds(eligibilityAt: Date): number {
  const now = new Date()
  const remaining = Math.floor((eligibilityAt.getTime() - now.getTime()) / 1000)
  return Math.max(0, remaining)
}

export function isTimerEligible(eligibilityAt: Date | null): boolean {
  if (!eligibilityAt) return false
  return new Date() >= eligibilityAt
}

export function formatRemainingTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Elegible'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
