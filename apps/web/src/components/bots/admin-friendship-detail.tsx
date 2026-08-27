'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface DetailBot {
  id: string
  request_status: string
  friendship_status: string
  request_sent_at: string | null
  friendship_confirmed_at: string | null
  fulfillment_account: {
    id: string
    name: string
    platform: string
    external_identifier: string | null
  }
}

interface Detail {
  id: string
  status: string
  platform: string
  platform_user_id: string
  required_bots: number
  created_at: string
  user: { nickname: string; email: string }
  bots: DetailBot[]
}

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString('es-MX') : '✗'
}

export function AdminFriendshipDetail() {
  const params = useParams<{ id: string }>()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingBot, setPendingBot] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/friendships/${params.id}`)
      const data = await res.json()
      if (data.success) setDetail(data.data)
      else setError(data.error?.message ?? 'No encontrada')
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCopyId() {
    if (!detail) return
    await navigator.clipboard.writeText(detail.platform_user_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAction(botId: string, action: 'mark-request-sent' | 'confirm-friendship') {
    setPendingBot(botId)
    setActionError(null)

    try {
      const res = await fetch(`/api/admin/friendships/${params.id}/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (!data.success) {
        setActionError(data.error?.message ?? 'Acción fallida')
        return
      }

      await refresh()
    } catch {
      setActionError('Error de conexión')
    } finally {
      setPendingBot(null)
    }
  }

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg border border-gray-800 bg-gray-900" />
  }

  if (error || !detail) {
    return (
      <div>
        <p className="text-red-400">{error}</p>
        <a href="/admin/friendships" className="mt-2 inline-block text-sm text-purple-400 hover:underline">
          Volver a la cola
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase text-gray-500">Cliente</span>
            <p className="font-bold text-white">{detail.user.nickname}</p>
          </div>
          <button
            onClick={handleCopyId}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              copied ? 'bg-green-600 text-white' : 'border border-gray-700 text-gray-200 hover:bg-gray-800'
            }`}
          >
            {copied ? '✓ Copiado' : `COPIAR ID (${detail.platform}: ${detail.platform_user_id})`}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Solicitud creada: {new Date(detail.created_at).toLocaleString('es-MX')}
        </p>
      </div>

      <h2 className="mt-6 text-lg font-bold text-white">Bots</h2>

      {actionError && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {detail.bots.map((bot, i) => (
          <div key={bot.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-white">
                BOT {i + 1} — {bot.fulfillment_account.name}
              </span>
              <span className="text-sm text-gray-400">{bot.fulfillment_account.platform}</span>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <dt className="inline text-gray-500 sm:mr-2">Solicitud enviada:</dt>
                <dd className={`inline ${bot.request_sent_at ? 'text-green-400' : 'text-gray-600'}`}>
                  {fmt(bot.request_sent_at)}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="inline text-gray-500 sm:mr-2">Amistad:</dt>
                <dd className={`inline ${bot.friendship_confirmed_at ? 'text-green-400' : 'text-gray-600'}`}>
                  {fmt(bot.friendship_confirmed_at)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              {bot.fulfillment_account.external_identifier && (
                <a
                  href={bot.fulfillment_account.external_identifier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-blue-500/50 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10"
                >
                  ABRIR CUENTA
                </a>
              )}
              {bot.request_status === 'PENDING' && (
                <button
                  onClick={() => handleAction(bot.id, 'mark-request-sent')}
                  disabled={pendingBot === bot.id}
                  className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-700 disabled:opacity-50"
                >
                  MARCAR SOLICITUD ENVIADA
                </button>
              )}
              {bot.request_status === 'REQUEST_SENT' && bot.friendship_status !== 'ACCEPTED' && (
                <button
                  onClick={() => handleAction(bot.id, 'confirm-friendship')}
                  disabled={pendingBot === bot.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  CONFIRMAR AMISTAD
                </button>
              )}
              {bot.friendship_status === 'ACCEPTED' && (
                <span className="rounded-lg bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-400">
                  ✓ AMIGO
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <a href="/admin/friendships" className="mt-8 inline-block text-sm text-purple-400 hover:underline">
        Volver a la cola
      </a>
    </div>
  )
}
