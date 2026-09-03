'use client'

import { useState, useEffect } from 'react'
import type { Metadata } from 'next'

interface UserData {
  id: string
  email: string
  nickname: string | null
  role: string
  created_at: string
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

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success) {
          setUserData(data.data)
        }
      } catch {
        console.error('Error fetching user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-800" />
        <div className="h-4 w-64 rounded bg-gray-800" />
        <div className="mt-6 h-32 rounded-lg bg-gray-800" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Mi cuenta</h1>
        <p className="mt-2 text-gray-400">Error al cargar los datos del usuario.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Mi cuenta</h1>
      <p className="mt-1 text-sm text-gray-400">
        Gestiona tu información y configuración.
      </p>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Información Personal</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Apodo</label>
            <p className="mt-1 text-white">{userData.nickname || 'Sin apodo'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <p className="mt-1 text-white">{userData.email}</p>
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
  )
}
