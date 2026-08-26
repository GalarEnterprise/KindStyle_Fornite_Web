'use client'

import { useCallback, useEffect, useState } from 'react'

export interface RequestSummary {
  id: string
  requestNumber: string
  status: string
  totalVbucks: number
  totalMxn: number
  whatsappOpenedAt: string | null
  createdAt: string
}

export function useRequests() {
  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/requests')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data)
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { requests, isLoading, refresh }
}
