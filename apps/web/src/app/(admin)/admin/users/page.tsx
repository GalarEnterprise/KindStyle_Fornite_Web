'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AdminUser {
  id: string
  email: string
  nickname: string | null
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { data, isLoading, mutate } = useSWR('/api/admin/users', fetcher)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nickname: '', role: 'ADMIN' })
  const [error, setError] = useState('')

  const users: AdminUser[] = data?.data ?? []

  if (data?.error?.code === 'FORBIDDEN') {
    return (
      <div className="p-8">
        <AdminPageHeader title="Gestión de Usuarios" />
        <p className="text-red-400">No tienes permisos para acceder a esta sección.</p>
      </div>
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (result.success) {
        setShowForm(false)
        setForm({ email: '', password: '', nickname: '', role: 'ADMIN' })
        mutate()
      } else {
        setError(result.error?.message || 'Error al crear')
      }
    } catch {
      setError('Error de red')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar este admin?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="p-8">
      <AdminPageHeader
        title="Gestión de Usuarios"
        description="Administradores del sistema"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500"
          >
            + Agregar Admin
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Nuevo Admin</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">Nickname</label>
              <input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500">
              Crear
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div>
                <p className="font-medium text-white">{user.nickname ?? user.email}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-xs ${
                  user.role === 'SUPER_ADMIN' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-300'
                }`}>
                  {user.role}
                </span>
                <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300 text-sm">
                  Desactivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
