'use client'

interface ValidatedBannerProps {
  message?: string
}

export function ValidatedBanner({ message = 'Validación Exitosa' }: ValidatedBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 shadow-lg">
        <span className="text-green-400">✓</span>
        <span className="text-sm font-medium text-green-300">{message}</span>
      </div>
    </div>
  )
}
