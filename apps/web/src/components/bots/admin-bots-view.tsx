'use client'

import { useCallback, useEffect, useState } from 'react'

export interface Bot {
  id: string
  name: string
  platform: string
  status: string
  capacity: number
  daily_limit: number
  current_usage: number
  external_identifier: string | null
}

const STATUS_OPTIONS = ['ACTIVE', 'COOLDOWN', 'LIMITED', 'UNAVAILABLE', 'DISABLED', 'ERROR']

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-green-400',
  COOLDOWN: 'text-yellow-400',
  LIMITED: 'text-orange-400',
  UNAVAILABLE: 'text-gray-400',
  DISABLED: 'text-red-400',
  ERROR: 'text-red-500',
}

export function AdminBotsView() {
  const [bots, setBots] = useState<Bot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bots')
      const data = await res.json()
      if (data.success) setBots(data.data)
      else setError(data.error?.message ?? 'Error al cargar bots')
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), platform: 'EPIC' }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear bot')
        return
      }

      setNewName('')
      await refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/bots/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Transición inválida')
        return
      }

      await refresh()
    } catch {
      setError('Error de conexión')
    }
  }

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg border border-gray-800 bg-gray-900" />
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del bot (ej. KindStyle 4)"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          Crear bot
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs uppercase text-gray-500">
              <th className="px-3 py-2">Bot</th>
              <th className="px-3 py-2">Plataforma</th>
              <th className="px-3 py-2">Uso</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {bots.map((bot) => (
              <tr key={bot.id}>
                <td className="px-3 py-2 font-medium text-white">{bot.name}</td>
                <td className="px-3 py-2 text-gray-400">{bot.platform}</td>
                <td className="px-3 py-2 text-gray-400">
                  {bot.current_usage} / {bot.capacity}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={bot.status}
                    onChange={(e) => handleStatusChange(bot.id, e.target.value)}
                    className={`rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs ${STATUS_COLORS[bot.status] ?? ''}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {bots.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  No hay bots registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
