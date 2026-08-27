'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface QueueItem {
  id: string
  status: string
  platform: string
  platform_user_id: string
  required_bots: number
  created_at: string
  user: { nickname: string }
  bots: Array<{ request_status: string; friendship_status: string }>
}

export function AdminFriendshipsQueue() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/friendships')
      const data = await res.json()
      if (data.success) setItems(data.data)
      else setError(data.error?.message ?? 'Error al cargar cola')
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg border border-gray-800 bg-gray-900" />
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-gray-500">No hay solicitudes de amistad</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/admin/friendships/${item.id}`}
          className="block rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-purple-500"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-white">
              {item.user.nickname}{' '}
              <span className="text-xs font-normal text-gray-500">
                ({item.platform}: {item.platform_user_id})
              </span>
            </span>
            <span className="rounded-full bg-gray-800 px-3 py-0.5 text-xs text-gray-300">{item.status}</span>
          </div>
          <div className="mt-1 flex flex-wrap justify-between gap-2 text-sm text-gray-400">
            <span>
              {item.bots.filter((b) => b.request_status === 'PENDING').length > 0 && (
                <span className="mr-3 rounded bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400">
                  Sin procesar
                </span>
              )}
              {item.bots.length} / {item.required_bots} bots
            </span>
            <span>{new Date(item.created_at).toLocaleString('es-MX')}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
