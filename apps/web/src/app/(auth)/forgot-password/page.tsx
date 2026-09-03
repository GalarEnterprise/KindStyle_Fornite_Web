'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'code'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al enviar el código')
        return
      }

      setStep('code')
      setCooldown(180) // 3 min cooldown
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Código inválido')
        if (data.error?.code === 'BLOCKED') {
          setCooldown(900)
        }
        return
      }

      // Navigate to reset password with token
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${data.token}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    if (cooldown > 0) return

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Error al reenviar')
        return
      }

      setCooldown(180)
    } catch {
      setError('Error de conexión')
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">
          {step === 'email' ? 'Recuperar contraseña' : 'Verificar código'}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {step === 'email'
            ? 'Ingresa tu email para recibir un código de verificación'
            : `Ingresa el código de 6 dígitos enviado a ${email}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
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
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-300">
              Código de verificación
            </label>
            <input
              id="code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-center text-2xl font-bold tracking-widest text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        {step === 'code' && (
          <button
            onClick={resendCode}
            disabled={cooldown > 0}
            className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
          >
            {cooldown > 0
              ? `Reenviar en ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
              : 'Reenviar código'}
          </button>
        )}
        <p className="mt-2 text-sm text-gray-400">
          <a href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
            Volver al login
          </a>
        </p>
      </div>
    </div>
  )
}
