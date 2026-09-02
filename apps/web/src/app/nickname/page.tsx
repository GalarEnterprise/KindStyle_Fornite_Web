'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

function NicknameForm() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const add = searchParams.get('add')
  const { user } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/user/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al guardar nickname')
        return
      }

      const params = new URLSearchParams()
      params.set('validated', '1')
      if (add) params.set('add', add)
      router.push(`/shop?${params.toString()}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Elige tu nickname</h1>
          <p className="mt-1 text-sm text-gray-400">
            Este será tu nombre visible en KindStyle
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium text-gray-300">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              minLength={3}
              maxLength={20}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Ej: Pablito123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>

        <button
          onClick={() => {
            const params = new URLSearchParams()
            params.set('validated', '1')
            if (add) params.set('add', add)
            router.push(`/shop?${params.toString()}`)
          }}
          className="mt-3 w-full rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  )
}

export default function NicknamePage() {
  return (
    <Suspense>
      <NicknameForm />
    </Suspense>
  )
}
