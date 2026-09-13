import type { Metadata } from 'next'
import { AccountBotsView } from '@/components/bots/account-bots-view'

export const metadata: Metadata = {
  title: 'Mis bots — KindStyle',
}

export default function AccountBotsPage() {
  return (
    <div className="min-h-screen bg-purple-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Mis bots</h1>
        <p className="mt-1 text-sm text-purple-300">
          Estado de tus bots de amistad para el gifting.
        </p>

        <div className="mt-6">
          <AccountBotsView />
        </div>
      </div>
    </div>
  )
}
