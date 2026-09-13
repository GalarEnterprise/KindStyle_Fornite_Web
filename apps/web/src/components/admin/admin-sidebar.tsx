'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/requests', label: 'Solicitudes', icon: '📋' },
  { href: '/admin/payments', label: 'Pagos', icon: '💳' },
  { href: '/admin/friendships', label: 'Amistades', icon: '👥' },
  { href: '/admin/bots', label: 'Bots', icon: '🤖' },
  { href: '/admin/users', label: 'Usuarios', icon: '👤' },
  { href: '/admin/settings', label: 'Configuración', icon: '⚙️' },
  { href: '/admin/audit', label: 'Auditoría', icon: '📝' },
]

const STORAGE_KEY = 'admin-sidebar-collapsed'

export function AdminSidebar() {
  const pathname = usePathname()
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Desktop collapsed state (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(false)
  // Mobile drawer open state (ephemeral, never persisted)
  const [open, setOpen] = useState(false)
  // Hydration guard - SSR always renders default, client adjusts in useEffect
  const [mounted, setMounted] = useState(false)

  // Hydrate desktop state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setCollapsed(true)
    } catch {
      // localStorage unavailable (SSR or private browsing) - ignore
    }
    setMounted(true)
  }, [])

  // Persist desktop collapsed state
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Ignore storage errors
    }
  }, [collapsed, mounted])

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const handleDesktopToggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const handleMobileToggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const closeMobileDrawer = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  return (
    <>
      {/* Mobile floating toggle - visible only when drawer is closed */}
      {!open && (
        <button
          ref={toggleRef}
          onClick={handleMobileToggle}
          className="fixed left-4 top-4 z-40 rounded-lg bg-purple-900 p-2 text-purple-300 shadow-lg transition hover:bg-purple-800 hover:text-white lg:hidden"
          aria-label="Abrir menú de navegación"
          aria-expanded={false}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - mobile: fixed drawer, desktop: in-flow strip */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 border-r border-purple-800 bg-purple-950 transition-all duration-200
          lg:relative lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${mounted && collapsed ? 'lg:w-12' : 'w-56 lg:w-56'}
        `}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          {/* Header with title and desktop toggle */}
          <div className="flex items-center justify-between p-4">
            <Link
              href="/admin/dashboard"
              className={`text-lg font-bold text-white ${mounted && collapsed ? 'lg:hidden' : ''}`}
            >
              Admin Panel
            </Link>
            {/* Desktop toggle button - inside sidebar strip */}
            <button
              onClick={handleDesktopToggle}
              className={`hidden rounded p-1 text-purple-300 transition hover:bg-purple-800 hover:text-white lg:block ${mounted && collapsed ? 'mx-auto' : ''}`}
              aria-label={collapsed ? 'Expandir menú de navegación' : 'Contraer menú de navegación'}
              aria-expanded={!collapsed}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            {/* Mobile close button */}
            <button
              onClick={closeMobileDrawer}
              className="rounded p-1 text-purple-300 transition hover:bg-purple-800 hover:text-white lg:hidden"
              aria-label="Cerrar menú de navegación"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2" role="navigation" aria-label="Menú de administración">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${
                  pathname === item.href
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200/70 hover:bg-purple-800 hover:text-white'
                } ${mounted && collapsed ? 'lg:justify-center lg:px-2' : ''}`}
                title={mounted && collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`${mounted && collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
