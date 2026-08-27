'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatRemainingTime, getRemainingSeconds } from '@kindstyle/shared'

interface CountdownTimerProps {
  eligibilityAt: Date | string | null
  onEligible?: () => void
}

export function CountdownTimer({ eligibilityAt, onEligible }: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const calculateRemaining = useCallback(() => {
    if (!eligibilityAt) return 0
    try {
      const date = typeof eligibilityAt === 'string' ? new Date(eligibilityAt) : eligibilityAt
      if (isNaN(date.getTime())) {
        setError('Fecha inválida')
        return 0
      }
      setError(null)
      return getRemainingSeconds(date)
    } catch {
      setError('Error calculando tiempo')
      return 0
    }
  }, [eligibilityAt])

  useEffect(() => {
    setRemainingSeconds(calculateRemaining())
  }, [calculateRemaining])

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return

    const interval = setInterval(() => {
      const seconds = calculateRemaining()
      setRemainingSeconds(seconds)

      if (seconds <= 0) {
        clearInterval(interval)
        onEligible?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingSeconds, calculateRemaining, onEligible])

  if (error) {
    return <span className="text-red-500 text-xs">{error}</span>
  }

  if (remainingSeconds === null) {
    return <span className="text-gray-400 animate-pulse">...</span>
  }

  if (!eligibilityAt) {
    return <span className="text-gray-500">Sin timer</span>
  }

  if (remainingSeconds <= 0) {
    return <span className="text-green-600 font-medium">Elegible</span>
  }

  return (
    <span className="text-blue-600" title={`Elegible en ${formatRemainingTime(remainingSeconds)}`}>
      ⏱ {formatRemainingTime(remainingSeconds)} restantes
    </span>
  )
}
