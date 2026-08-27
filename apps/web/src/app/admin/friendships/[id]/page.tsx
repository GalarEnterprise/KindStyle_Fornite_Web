import type { Metadata } from 'next'
import { AdminFriendshipDetail } from '@/components/bots/admin-friendship-detail'

export const metadata: Metadata = {
  title: 'Detalle de Amistad — Admin KindStyle',
}

export default function AdminFriendshipDetailPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Friendship Request</h1>

        <div className="mt-6">
          <AdminFriendshipDetail />
        </div>
      </div>
    </div>
  )
}
