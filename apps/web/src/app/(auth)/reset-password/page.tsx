'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const code = searchParams.get('code') || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, confirmPassword, token }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al restablecer la contraseña')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (!email || (!token && !code)) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Enlace inválido</h1>
          <p className="mt-2 text-sm text-gray-400">
            El enlace de restablecimiento no es válido o ha expirado.
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm font-semibold text-purple-400 hover:text-purple-300"
          >
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/20">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Contraseña actualizada</h1>
          <p className="mt-2 text-sm text-gray-400">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-gray-400">
          Ingresa tu nueva contraseña para <span className="font-semibold text-white">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-300">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setError(null)
            }}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Repite la contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        <a href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
          Volver al login
        </a>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 mx-auto rounded bg-gray-800" />
          <div className="mt-4 h-4 w-64 mx-auto rounded bg-gray-800" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
