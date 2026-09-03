'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export function UserMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
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
                href="/account"
                onClick={handleMenuClick}
                className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Mi Cuenta
              </Link>
              <Link
                href="/account/profile"
                onClick={handleMenuClick}
                className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Mi Perfil
              </Link>
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
    </div>
  )
}
