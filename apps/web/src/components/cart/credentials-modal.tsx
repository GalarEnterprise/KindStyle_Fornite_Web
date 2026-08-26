'use client'

import { useState, useEffect } from 'react'
import { CredentialsSchema } from '@/lib/validators/cart'

interface CredentialsModalProps {
  open: boolean
  productName: string
  loading?: boolean
  error?: string | null
  onSubmit: (credentials: { epicEmail: string; epicPassword: string }) => void
  onCancel: () => void
}

export function CredentialsModal({
  open,
  productName,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}: CredentialsModalProps) {
  const [epicEmail, setEpicEmail] = useState('')
  const [epicPassword, setEpicPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setEpicEmail('')
      setEpicPassword('')
      setValidationError(null)
    }
  }, [open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = CredentialsSchema.safeParse({ epicEmail, epicPassword })
    if (!parsed.success) {
      setValidationError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }
    setValidationError(null)
    onSubmit(parsed.data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-bold text-white">Credenciales de Epic</h2>
        <p className="mt-1 text-sm text-gray-400">
          Para regalar <span className="font-semibold text-white">{productName}</span> necesitamos las credenciales
          de tu cuenta de Epic Games. Se almacenan encriptadas y nunca se comparten.
        </p>

        {(validationError || error) && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="epic-email" className="mb-1 block text-sm font-medium text-gray-300">
              Email de Epic
            </label>
            <input
              id="epic-email"
              type="email"
              value={epicEmail}
              onChange={(e) => setEpicEmail(e.target.value)}
              required
              autoComplete="off"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="epic-password" className="mb-1 block text-sm font-medium text-gray-300">
              Contraseña de Epic
            </label>
            <input
              id="epic-password"
              type="password"
              value={epicPassword}
              onChange={(e) => setEpicPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar al carrito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
