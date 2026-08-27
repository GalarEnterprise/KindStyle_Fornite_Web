'use client'

import { useCallback, useEffect, useState } from 'react'

export interface FriendshipBot {
  id: string
  request_status: string
  friendship_status: string
  bot_name: string
  bot_platform: string
}

export interface FriendshipPanel {
  id: string
  platform: string
  platform_user_id: string
  status: string
  required_bots: number
  bots: FriendshipBot[]
}

export function useFriendship() {
  const [panel, setPanel] = useState<FriendshipPanel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/friendship')
      const data = await res.json()
      if (data.success) {
        setPanel(data.data)
      } else {
        setError(data.error?.message ?? 'Error al cargar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { panel, isLoading, error, refresh }
}
