'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Bot {
  id: string
  name: string
  request_status: string
  friendship_status: string
  eligibility_at: string | null
  fulfillment_account: { id: string; name: string }
}

interface FriendshipRequest {
  id: string
  status: string
  created_at: string
  user: { id: string; email: string; nickname: string | null }
  bots: Bot[]
}

export default function AdminFriendshipsPage() {
  const { data, isLoading, mutate } = useSWR('/api/admin/friendships', fetcher, { refreshInterval: 30000 })
  const [selected, setSelected] = useState<FriendshipRequest | null>(null)

  const requests: FriendshipRequest[] = data?.data ?? []

  async function handleAction(botId: string, action: string) {
    await fetch(`/api/admin/friendships/${selected?.id}/bots/${botId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    mutate()
    setSelected(null)
  }

  function getTimerStatus(bot: Bot) {
    if (!bot.eligibility_at) return null
    const now = new Date()
    const eligible = new Date(bot.eligibility_at)
    const diff = eligible.getTime() - now.getTime()
    if (diff <= 0) return '✅ Elegible'
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return `⏱ ${hours}h ${mins}m`
  }

  return (
    <div className="p-8">
      <AdminPageHeader title="Solicitudes de Amistad" description="Cola de amistades prioritaria" />

      {isLoading ? (
        <div className="animate-pulse text-purple-300">Cargando...</div>
      ) : selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="mb-4 text-sm text-purple-400 hover:text-purple-300">
            ← Volver a la cola
          </button>
          <div className="rounded-lg border border-purple-800 bg-purple-900 p-6">
            <h2 className="text-lg font-bold text-white">{selected.user.nickname ?? selected.user.email}</h2>
            <p className="text-sm text-purple-300">{selected.user.email}</p>

            <div className="mt-4 space-y-3">
              {selected.bots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between rounded border border-purple-800 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{bot.fulfillment_account.name}</p>
                    <p className="text-xs text-purple-300">
                      Solicitud: {bot.request_status} — Amistad: {bot.friendship_status}
                    </p>
                    {bot.eligibility_at && (
                      <p className="text-xs text-purple-300">Timer: {getTimerStatus(bot)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(bot.request_status === 'PENDING' || bot.friendship_status === 'PENDING') && (
                      <button
                        onClick={() => handleAction(bot.id, 'SEND_REQUEST')}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
                      >
                        ENVIAR SOLICITUD
                      </button>
                    )}
                    {bot.request_status === 'PENDING' && bot.friendship_status === 'PENDING' && (
                      <button
                        onClick={() => handleAction(bot.id, 'MARK_SENT')}
                        className="rounded bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-500"
                      >
                        MARCAR ENVIADA
                      </button>
                    )}
                    {bot.request_status === 'REQUEST_SENT' && bot.friendship_status === 'PENDING' && (
                      <button
                        onClick={() => handleAction(bot.id, 'CONFIRM')}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-500"
                      >
                        CONFIRMAR AMISTAD
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelected(req)}
              className="w-full rounded-lg border border-purple-800 bg-purple-900 p-4 text-left transition hover:bg-purple-800/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{req.user.nickname ?? req.user.email}</p>
                  <p className="text-xs text-purple-300">{req.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-100">{req.bots.length} bots</p>
                  <p className="text-xs text-purple-300">
                    {req.bots.filter((b) => b.friendship_status === 'ACCEPTED').length} aceptados
                  </p>
                </div>
              </div>
            </button>
          ))}
          {requests.length === 0 && (
            <p className="text-center text-purple-300">No hay solicitudes pendientes</p>
          )}
        </div>
      )}
    </div>
  )
}
