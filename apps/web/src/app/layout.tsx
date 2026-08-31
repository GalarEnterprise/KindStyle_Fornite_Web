import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'KindStyle — Tienda de Fortnite',
  description: 'Tienda de Fortnite con sistema de gifting manual. Regalos seguros de skins, V-Bucks y más.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
