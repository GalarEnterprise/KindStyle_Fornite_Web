import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RequestConfirmation } from '@/components/requests/request-confirmation'

export const metadata: Metadata = {
  title: 'Confirmación de solicitud — KindStyle',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Suspense>
        <RequestConfirmation />
      </Suspense>
    </div>
  )
}
