'use client'

import { useState } from 'react'
import { PLATFORM_LABELS } from '@/lib/validators/bots'
import type { Platform } from '@prisma/client'

const PLATFORMS: Array<{ value: Platform; label: string; placeholder: string }> = [
  { value: 'EPIC', label: 'Epic Games', placeholder: 'Tu ID de Epic Games' },
  { value: 'XBOX', label: 'Xbox', placeholder: 'Tu Gamertag' },
  { value: 'PLAYSTATION', label: 'PlayStation', placeholder: 'Tu PSN ID' },
]

export function PlatformRegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const [platform, setPlatform] = useState<Platform>('EPIC')
  const [platformUserId, setPlatformUserId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/friendship', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ platform, platform_user_id: platformUserId }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Error al registrar')
        return
      }

      onRegistered()
    } catch {
      setError('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-lg font-bold text-white">¿Dónde tienes tu cuenta?</h2>
      <p className="mt-1 text-sm text-gray-400">
        Agrega tu ID para que podamos enviarte la solicitud de amistad.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPlatform(p.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              platform === p.value
                ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                : 'border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm text-gray-300" htmlFor="platform-user-id">
        {PLATFORM_LABELS[platform]}
      </label>
      <input
        id="platform-user-id"
        value={platformUserId}
        onChange={(e) => setPlatformUserId(e.target.value)}
        placeholder={PLATFORMS.find((p) => p.value === platform)?.placeholder}
        maxLength={100}
        required
        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
      />

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !platformUserId.trim()}
        className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Registrando...' : 'Registrar y solicitar bots'}
      </button>
    </form>
  )
}
