'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

type LoginStep = 'request-code' | 'enter-code'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState<'code' | 'password'>('code')
  const [step, setStep] = useState<LoginStep>('request-code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const add = searchParams.get('add')
  const { refresh } = useAuth()

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.error?.code === 'COOLDOWN') {
          setCooldown(data.error.cooldownRemaining || 180)
          setError(data.error.message)
        } else {
          setError(data.error?.message || 'Error al enviar el código')
        }
        return
      }

      // Move to code entry step
      setStep('enter-code')
      setCooldown(180) // 3 minutes cooldown for resend
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    if (cooldown > 0) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.error?.code === 'COOLDOWN') {
          setCooldown(data.error.cooldownRemaining || 180)
          setError(data.error.message)
        } else {
          setError(data.error?.message || 'Error al enviar el código')
        }
        return
      }

      setCooldown(180)
      setError(null)
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method: 'code', code }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al iniciar sesión')
        return
      }

      // Refrescar el estado del auth context antes de navegar
      await refresh()

      if (data.user?.isFirstLogin) {
        const params = new URLSearchParams()
        if (add) params.set('add', add)
        const q = params.toString() ? `?${params.toString()}` : ''
        router.push(`/nickname${q}`)
      } else {
        const params = new URLSearchParams()
        params.set('validated', '1')
        if (add) params.set('add', add)
        router.push(`/shop?${params.toString()}`)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method: 'password', password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || 'Error al iniciar sesión')
        return
      }

      // Refrescar el estado del auth context antes de navegar
      await refresh()

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

  function handleBackToRequest() {
    setStep('request-code')
    setCode('')
    setError(null)
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-gray-400">Ingresa a tu cuenta KindStyle</p>
      </div>

      <div className="mb-4 flex rounded-lg bg-gray-800 p-1">
        <button
          onClick={() => {
            setMethod('code')
            setStep('request-code')
            setCode('')
            setError(null)
          }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            method === 'code' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Código
        </button>
        <button
          onClick={() => {
            setMethod('password')
            setStep('request-code')
            setCode('')
            setError(null)
          }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            method === 'password' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Contraseña
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {method === 'code' ? (
        step === 'request-code' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
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
              disabled={loading || cooldown > 0}
              className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="email-display" className="mb-1 block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="email-display"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleBackToRequest}
                  className="whitespace-nowrap text-sm text-purple-400 hover:text-purple-300"
                >
                  Cambiar
                </button>
              </div>
            </div>

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
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-center text-xl font-bold tracking-widest text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || cooldown > 0}
                className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
              </button>
            </div>
          </form>
        )
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-gray-400">
        ¿No tienes cuenta?{' '}
        <a href="/register" className="font-semibold text-purple-400 hover:text-purple-300">
          Regístrate
        </a>
      </p>
      <p className="mt-2 text-center text-sm text-gray-400">
        <a href="/forgot-password" className="font-semibold text-purple-400 hover:text-purple-300">
          ¿Olvidaste tu contraseña?
        </a>
      </p>
    </div>
  )
}
