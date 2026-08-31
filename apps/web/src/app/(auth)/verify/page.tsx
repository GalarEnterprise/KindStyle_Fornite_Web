import { Suspense } from 'react'
import { VerifyCodeForm } from '@/components/auth/verify-code-form'

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="text-center">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <VerifyCodeForm />
    </Suspense>
  )
}
