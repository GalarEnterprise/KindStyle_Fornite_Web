'use client'

import type { BundleConflictPayload } from '@/hooks/use-cart'

interface BundleConflictDialogProps {
  conflict: BundleConflictPayload
  loading?: boolean
  error?: string | null
  onKeepSeparate: () => void
  onReplaceWithBundle: () => void
  onCancel: () => void
}

export function BundleConflictDialog({
  conflict,
  loading = false,
  error = null,
  onKeepSeparate,
  onReplaceWithBundle,
  onCancel,
}: BundleConflictDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bundle-conflict-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 id="bundle-conflict-title" className="text-lg font-bold text-white">
          Artículos duplicados en tu carrito
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          <span className="font-semibold text-white">{conflict.bundle.name}</span> incluye artículos
          que ya agregaste por separado:
        </p>

        <ul className="mt-3 space-y-1 rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-200">
          {conflict.conflictingItems.map((item) => (
            <li key={item.cartItemId} className="flex items-center gap-2">
              <span className="text-purple-400">•</span>
              {item.name || 'Artículo'}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-gray-400">
          ¿Prefieres conservar los artículos por separado o usar el pack completo? Al usar el pack,
          los artículos listados se quitarán de tu carrito.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onReplaceWithBundle}
            disabled={loading}
            data-testid="conflict-replace"
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Aplicando...' : `Usar pack completo (${conflict.bundle.priceVbucks.toLocaleString('es-MX')} V)`}
          </button>
          <button
            type="button"
            onClick={onKeepSeparate}
            disabled={loading}
            data-testid="conflict-keep"
            className="w-full rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
          >
            Conservar artículos por separado
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            data-testid="conflict-cancel"
            className="w-full rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:text-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
