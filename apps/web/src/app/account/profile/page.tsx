'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface UserData {
  id: string
  email: string
  nickname: string | null
  role: string
  created_at: string
  hasPassword: boolean
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

  // Password management state
  const [passwordMode, setPasswordMode] = useState<'none' | 'create' | 'change'>('none')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

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

  async function handleCreatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', password: newPassword, confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setPasswordSuccess('Contraseña creada correctamente')
        setPasswordMode('none')
        setUserData((prev) => (prev ? { ...prev, hasPassword: true } : null))
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.error?.message || 'Error al crear la contraseña')
      }
    } catch {
      setPasswordError('Error de conexión')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword) {
      setPasswordError('La contraseña actual es requerida')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setPasswordSuccess('Contraseña actualizada correctamente')
        setPasswordMode('none')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.error?.message || 'Error al cambiar la contraseña')
      }
    } catch {
      setPasswordError('Error de conexión')
    } finally {
      setPasswordLoading(false)
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-800" />
        <div className="h-4 w-64 rounded bg-gray-800" />
        <div className="mt-6 h-40 rounded-lg bg-gray-800" />
      </div>
    )
  }

  if (!userData) {
    return (
      <p className="text-gray-400">Error al cargar los datos del usuario.</p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
      <p className="mt-1 text-sm text-gray-400">
        Gestiona tu información personal y configuración de cuenta.
      </p>

      {/* Personal Info */}
      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
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

      {/* Password Management */}
      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Contraseña</h2>

        {passwordMode === 'none' && (
          <div className="mt-4">
            <p className="text-sm text-gray-400">
              {userData.hasPassword
                ? 'Tienes una contraseña configurada.'
                : 'Aún no tienes contraseña configurada.'}
            </p>
            <button
              onClick={() => setPasswordMode(userData.hasPassword ? 'change' : 'create')}
              className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              {userData.hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
            </button>
          </div>
        )}

        {passwordMode === 'create' && (
          <form onSubmit={handleCreatePassword} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="Repite la contraseña"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {passwordLoading ? 'Creando...' : 'Crear contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordMode('none')
                  setPasswordError(null)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {passwordMode === 'change' && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Contraseña actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="Tu contraseña actual"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="Repite la nueva contraseña"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-400">{passwordSuccess}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {passwordLoading ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordMode('none')
                  setPasswordError(null)
                  setPasswordSuccess(null)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
