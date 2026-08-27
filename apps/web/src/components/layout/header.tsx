'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useFriendship } from '@/hooks/use-friendship'
import { CartBadge } from '@/components/cart/cart-badge'

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
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white">
          Kind<span className="text-purple-500">Style</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Tienda
          </Link>

          <CartBadge />

          <BotsCta />

          {isAuthenticated ? (
            <>
              <Link
                href="/account/profile"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                {user?.nickname ?? 'Mi cuenta'}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-purple-400 transition hover:bg-purple-900/30 hover:text-purple-300"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                Salir
              </button>
            </>
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
