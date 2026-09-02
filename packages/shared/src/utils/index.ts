export function generateRequestNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `REQ-${date}-${suffix}`
}

export function formatVbucks(amount: number): string {
  return new Intl.NumberFormat('es-MX').format(amount)
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

export function calculateRemainingTime(eligibilityAt: Date): number {
  return eligibilityAt.getTime() - Date.now()
}

export function isEligible(eligibilityAt: Date): boolean {
  return Date.now() >= eligibilityAt.getTime()
}

export * from './shop-banner'
