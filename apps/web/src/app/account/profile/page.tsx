'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

interface UserData {
  id: string
  email: string
  nickname: string | null
  role: string
  created_at: string
}

export default function ProfilePage() {
  const { user: authUser, refresh } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nickname, setNickname] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success) {
          setUserData(data.data)
          setNickname(data.data.nickname || '')
        }
      } catch {
        console.error('Error fetching user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  async function handleSaveNickname() {
    if (!nickname || nickname.length < 3 || nickname.length > 20) {
      setError('El apodo debe tener entre 3 y 20 caracteres')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      setError('El apodo solo puede contener letras, números y guiones bajos')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/user/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Apodo actualizado correctamente')
        setIsEditing(false)
        setUserData((prev) => (prev ? { ...prev, nickname: data.user.nickname } : null))
        await refresh()
      } else {
        setError(data.error?.message || 'Error al actualizar el apodo')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsSaving(false)
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'ADMIN':
        return 'Admin'
      default:
        return 'Usuario'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-gray-800" />
            <div className="mt-4 h-4 w-64 rounded bg-gray-800" />
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-gray-400">Error al cargar los datos del usuario.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestiona tu información personal y configuración de cuenta.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/account/profile"
            className="rounded-lg border border-purple-500/50 bg-gray-900 p-6 transition hover:border-purple-500"
          >
            <h2 className="text-lg font-semibold text-white">Perfil</h2>
            <p className="mt-1 text-sm text-gray-400">
              Información personal y configuración.
            </p>
          </Link>

          <Link
            href="/account/requests"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Mis solicitudes</h2>
            <p className="mt-1 text-sm text-gray-400">
              Historial de tus compras y su estado.
            </p>
          </Link>

          <Link
            href="/account/bots"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Mis bots</h2>
            <p className="mt-1 text-sm text-gray-400">
              Bots configurados para amistad y envío.
            </p>
          </Link>

          <Link
            href="/account/payment"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Pagos</h2>
            <p className="mt-1 text-sm text-gray-400">
              Estados de pago y comprobantes.
            </p>
          </Link>

          <Link
            href="/account/notifications"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
            <p className="mt-1 text-sm text-gray-400">
              Alertas y avisos importantes.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-white">Información Personal</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Email</label>
              <p className="mt-1 text-white">{userData.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Apodo</label>
              {isEditing ? (
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value)
                      setError(null)
                    }}
                    className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Tu apodo"
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={isSaving}
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setNickname(userData.nickname || '')
                      setError(null)
                    }}
                    className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-white">{userData.nickname || 'Sin apodo'}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Editar
                  </button>
                </div>
              )}
              {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
              {success && <p className="mt-1 text-sm text-green-400">{success}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Rol</label>
              <p className="mt-1 text-white">{getRoleLabel(userData.role)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">
                Miembro desde
              </label>
              <p className="mt-1 text-white">
                {new Date(userData.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
