'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRemainingSeconds, isTimerEligible } from '@kindstyle/shared'

interface UseCountdownReturn {
  remainingSeconds: number
  isEligible: boolean
  formattedTime: string
  refresh: () => void
}

export function useCountdown(eligibilityAt: Date | string | null): UseCountdownReturn {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!eligibilityAt) return 0
    const date = typeof eligibilityAt === 'string' ? new Date(eligibilityAt) : eligibilityAt
    return getRemainingSeconds(date)
  })

  const calculateRemaining = useCallback(() => {
    if (!eligibilityAt) return 0
    const date = typeof eligibilityAt === 'string' ? new Date(eligibilityAt) : eligibilityAt
    return getRemainingSeconds(date)
  }, [eligibilityAt])

  useEffect(() => {
    const initial = calculateRemaining()
    setRemainingSeconds(initial)

    if (!eligibilityAt || initial <= 0) return

    const interval = setInterval(() => {
      const seconds = calculateRemaining()
      setRemainingSeconds(seconds)

      if (seconds <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [eligibilityAt, calculateRemaining])

  const refresh = useCallback(() => {
    setRemainingSeconds(calculateRemaining())
  }, [calculateRemaining])

  const formattedTime = remainingSeconds > 0
    ? `${Math.floor(remainingSeconds / 3600)}h ${Math.floor((remainingSeconds % 3600) / 60)}m`
    : 'Elegible'

  return {
    remainingSeconds,
    isEligible: remainingSeconds <= 0,
    formattedTime,
    refresh,
  }
}
