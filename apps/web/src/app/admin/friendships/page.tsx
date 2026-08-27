import type { Metadata } from 'next'
import { AdminFriendshipsQueue } from '@/components/bots/admin-friendships-queue'

export const metadata: Metadata = {
  title: 'Friendships — Admin KindStyle',
}

export default function AdminFriendshipsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Solicitudes de Amistad</h1>

        <div className="mt-6">
          <AdminFriendshipsQueue />
        </div>
      </div>
    </div>
  )
}
