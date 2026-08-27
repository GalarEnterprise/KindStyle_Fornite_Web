import { Header } from '@/components/layout/header'
import { ReadinessBanner } from '@/components/bots/readiness-banner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <ReadinessBanner />
      <main>{children}</main>
    </div>
  )
}
