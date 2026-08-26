'use client'

import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { CartProvider } from '@/hooks/use-cart'

function CartProviderGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return <CartProvider isAuthenticated={isAuthenticated}>{children}</CartProvider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProviderGate>{children}</CartProviderGate>
    </AuthProvider>
  )
}
