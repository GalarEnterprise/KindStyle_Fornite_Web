import type { Metadata } from 'next'
import { AdminBotsView } from '@/components/bots/admin-bots-view'

export const metadata: Metadata = {
  title: 'Gestión de Bots — Admin KindStyle',
}

export default function AdminBotsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Gestión de Bots</h1>

        <div className="mt-6">
          <AdminBotsView />
        </div>
      </div>
    </div>
  )
}
