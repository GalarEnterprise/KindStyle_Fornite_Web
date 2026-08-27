'use client'

export function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-white">¿Por qué necesitamos agregarte como amigo?</h3>
        <p className="mt-3 text-sm text-gray-300">
          Para poder enviarte regalos de Fortnite, nuestras cuentas de entrega deben agregarte como
          amigo.
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Fortnite establece un período mínimo de amistad antes de que pueda realizarse el gifting.
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Por eso recomendamos configurar tus bots antes de realizar tu solicitud.
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Mientras antes los agregues, antes podremos preparar tu cuenta para tus regalos.
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
