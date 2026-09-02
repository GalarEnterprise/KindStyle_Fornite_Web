export interface PaymentMethodInfo {
  id: 'TRANSFER' | 'OXXO'
  label: string
  icon: string
  description: string
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'TRANSFER',
    label: 'Transferencia bancaria',
    icon: '🏦',
    description: 'Depósito directo o transferencia desde tu app bancaria',
  },
  {
    id: 'OXXO',
    label: 'OXXO',
    icon: '🏪',
    description: 'Paga en efectivo en cualquier tienda OXXO',
  },
]

export const PAYMENT_DETAILS = {
  transfer: {
    clabe: process.env.PAYMENT_CLABE || '722969040853088360',
    beneficiary: process.env.PAYMENT_BENEFICIARY || 'Lidia Isela Perez R.',
    bank: process.env.PAYMENT_BANK || 'Banco',
    instructions: [
      'Abre tu app bancaria o ve a un cajero automático',
      'Selecciona transferencia o depósito',
      'Ingresa la CLABE y el monto exacto',
      'Toma captura del comprobante de pago',
      'Envía la captura por WhatsApp para confirmar tu pago',
    ],
  },
  oxxo: {
    account: process.env.PAYMENT_OXXO_ACCOUNT || '4217470331487708',
    beneficiary: process.env.PAYMENT_BENEFICIARY || 'Lidia Isela Perez R.',
    instructions: [
      'Acude a cualquier tienda OXXO',
      'Indica que quieres hacer un depósito o pago',
      'Proporciona el número de cuenta y el monto exacto',
      'Guarda tu ticket de comprobante',
      'Envía foto del ticket por WhatsApp para confirmar tu pago',
    ],
  },
}

export function formatClabe(clabe: string): string {
  return clabe.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatOxxoAccount(account: string): string {
  return account.replace(/(\d{4})(?=\d)/g, '$1 ')
}
