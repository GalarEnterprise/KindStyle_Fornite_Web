'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/account/profile', label: 'Mi Perfil', icon: '👤' },
  { href: '/account/requests', label: 'Mis solicitudes', icon: '📋' },
  { href: '/account/bots', label: 'Mis bots', icon: '🤖' },
  { href: '/account/payment', label: 'Pagos', icon: '💳' },
  { href: '/account/notifications', label: 'Notificaciones', icon: '🔔' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-purple-950">
      {/* Mobile hamburger button */}
      <div className="fixed left-0 top-0 z-50 flex items-center border-b border-purple-800 bg-purple-950 px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-1.5 text-purple-300 hover:bg-purple-800 hover:text-white"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="ml-3 text-sm font-semibold text-white">Mi cuenta</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-purple-800 bg-purple-900 transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="border-b border-purple-800 p-4">
            <h2 className="text-lg font-bold text-white">Mi cuenta</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-200/70 hover:bg-purple-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Return to shop */}
          <div className="border-t border-purple-800 p-3">
            <Link
              href="/shop"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-200/70 transition hover:bg-purple-800 hover:text-white"
            >
              <span className="text-base">🏪</span>
              Volver a la tienda
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
