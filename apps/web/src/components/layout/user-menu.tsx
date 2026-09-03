'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

export function UserMenu() {
  const { user, isAdmin, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  async function handleLogout() {
    setIsOpen(false)
    await logout()
    router.push('/')
  }

  function handleMenuClick() {
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user?.nickname ?? 'Mi cuenta'}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="py-1">
              <Link
                href="/account/profile"
                onClick={handleMenuClick}
                className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Mi Cuenta
              </Link>
              <button
                onClick={() => {
                  setShowNotifications(true)
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Notificaciones
                </span>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <Link
                href="/account/requests"
                onClick={handleMenuClick}
                className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Mis Pedidos
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={handleMenuClick}
                  className="block px-4 py-2 text-sm text-purple-400 transition hover:bg-gray-800 hover:text-purple-300"
                >
                  Admin
                </Link>
              )}
              <hr className="my-1 border-gray-800" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
      {showNotifications && (
        <NotificationDropdown onClose={() => setShowNotifications(false)} />
      )}
    </div>
  )
}
