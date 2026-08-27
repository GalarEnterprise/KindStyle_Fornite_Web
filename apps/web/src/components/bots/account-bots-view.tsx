'use client'

import Link from 'next/link'
import { useFriendship } from '@/hooks/use-friendship'
import { PlatformRegisterForm } from '@/components/bots/platform-register-form'
import { BotList } from '@/components/bots/bot-list'

export function AccountBotsView() {
  const { panel, isLoading, error, refresh } = useFriendship()

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="h-5 w-1/3 rounded bg-gray-800" />
        <div className="mt-4 h-16 w-full rounded bg-gray-800" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {!panel ? (
        <PlatformRegisterForm onRegistered={refresh} />
      ) : (
        <>
          {panel.status === 'READY' && (
            <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
              🟢 Tu cuenta está preparada para gifting
            </div>
          )}
          {panel.status === 'PARTIALLY_READY' && (
            <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-blue-300">
              Tu cuenta está en preparación
            </div>
          )}
          <BotList panel={panel} onChanged={refresh} />
        </>
      )}

      <Link href="/shop" className="mt-8 inline-block text-sm text-purple-400 hover:underline">
        Volver a la tienda
      </Link>
    </div>
  )
}
