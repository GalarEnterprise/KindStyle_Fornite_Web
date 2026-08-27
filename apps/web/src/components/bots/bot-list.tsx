'use client'

import { useState } from 'react'
import type { FriendshipPanel } from '@/hooks/use-friendship'

const PLATFORM_SHORT: Record<string, string> = {
  EPIC: 'Epic',
  XBOX: 'Xbox',
  PLAYSTATION: 'PSN',
}

function botState(bot: { request_status: string; friendship_status: string }) {
  if (bot.friendship_status === 'ACCEPTED') {
    return { label: 'Amigo', color: 'text-green-400', dot: '🟢' }
  }
  if (bot.request_status === 'REQUEST_SENT') {
    return { label: 'Solicitud enviada', color: 'text-yellow-400', dot: '🟡' }
  }
  return { label: 'No agregado', color: 'text-gray-500', dot: '⚪' }
}

export function BotList({ panel, onChanged }: { panel: FriendshipPanel; onChanged: () => void }) {
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRequestMore = panel.bots.length < panel.required_bots

  async function handleRequestBot() {
    setRequesting(true)
    setError(null)

    try {
      const res = await fetch(`/api/friendship/${panel.id}/add-bot`, { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Error al solicitar bot')
        return
      }

      onChanged()
    } catch {
      setError('Error de conexión')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Mis bots</h2>
        <span className="text-sm text-gray-400">
          {panel.bots.length} de {panel.required_bots}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {panel.bots.map((bot) => {
          const state = botState(bot)
          return (
            <div
              key={bot.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <div>
                <span className="font-medium text-white">{bot.bot_name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  — {PLATFORM_SHORT[bot.bot_platform] ?? bot.bot_platform}
                </span>
              </div>
              <span className={`text-sm font-medium ${state.color}`}>
                {state.dot} {state.label}
              </span>
            </div>
          )
        })}

        {canRequestMore && (
          <div className="rounded-lg border border-dashed border-gray-700 px-4 py-3">
            <button
              onClick={handleRequestBot}
              disabled={requesting}
              className="w-full rounded-lg border border-purple-500 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10 disabled:opacity-50"
            >
              {requesting ? 'Solicitando...' : 'SOLICITAR'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
