export default function PaymentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Pagos</h1>
      <p className="mt-1 text-sm text-purple-300">
        Estados de pago y comprobantes.
      </p>

      <div className="mt-6 rounded-lg border border-purple-800 bg-purple-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-800">
          <span className="text-3xl">💳</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Próximamente</h2>
        <p className="mt-2 text-sm text-purple-300">
          La gestión de pagos estará disponible pronto.
        </p>
      </div>
    </div>
  )
}
