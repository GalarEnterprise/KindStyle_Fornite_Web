'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useFriendship } from '@/hooks/use-friendship'
import { CartBadge } from '@/components/cart/cart-badge'
import { UserMenu } from '@/components/layout/user-menu'

export function BotsCta() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { panel, isLoading } = useFriendship()

  if (!isAuthenticated || isAdmin) return null
  if (isLoading) return null

  if (!panel) {
    return (
      <Link
        href="/account/bots"
        className="animate-pulse rounded-md bg-purple-600/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-purple-500"
      >
        AGREGAR BOTS ✨
      </Link>
    )
  }

  if (panel.status === 'READY') {
    return (
      <Link
        href="/account/bots"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-green-400 transition hover:bg-gray-800"
      >
        BOTS ✓
      </Link>
    )
  }

  return (
    <Link
      href="/account/bots"
      className="rounded-md px-3 py-1.5 text-sm font-medium text-yellow-400 transition hover:bg-gray-800"
    >
      BOTS 🟡
    </Link>
  )
}

export function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/shop" className="flex-shrink-0 text-lg font-bold text-white hover:text-gray-200 transition">
          Kind<span className="text-purple-500">Style</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <CartBadge />

          <BotsCta />

          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
