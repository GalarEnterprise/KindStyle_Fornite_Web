import { Header } from '@/components/layout/header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main>{children}</main>
    </div>
  )
}
