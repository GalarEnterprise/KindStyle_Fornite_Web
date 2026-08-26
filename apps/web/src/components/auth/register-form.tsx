'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al registrar')
        return
      }

      setSuccess(true)
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <div className="mb-4 text-4xl">📧</div>
        <h2 className="mb-2 text-xl font-bold text-white">Código enviado</h2>
        <p className="mb-4 text-gray-400">
          Revisa tu correo <span className="font-semibold text-white">{email}</span> para obtener el código de verificación.
        </p>
        <button
          onClick={() => router.push(`/verify?email=${encodeURIComponent(email)}`)}
          className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Ir a verificar
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
        <p className="mt-1 text-sm text-gray-400">Ingresa tu email para comenzar</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="tu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar código'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
          Inicia sesión
        </a>
      </p>
    </div>
  )
}
