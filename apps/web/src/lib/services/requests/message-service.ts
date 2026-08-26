const DEFAULT_WHATSAPP_NUMBER = '+523191033181'

export interface RequestMessageData {
  requestNumber: string
  nickname: string
  items: Array<{
    productName: string
    quantity: number
    priceVbucks: number
  }>
  totalVbucks: number
  totalMxn: number
}

export function buildRequestMessage(request: RequestMessageData): string {
  const lines: string[] = []

  lines.push('Nueva solicitud KindStyle')
  lines.push(`Solicitud: ${request.requestNumber}`)
  lines.push(`Cliente: ${request.nickname}`)
  lines.push('')
  lines.push('Productos:')

  for (const item of request.items) {
    lines.push(`- ${item.productName} x${item.quantity} (${item.priceVbucks.toLocaleString('es-MX')} V-Bucks)`)
  }

  lines.push('')
  lines.push(`Total: ${request.totalVbucks.toLocaleString('es-MX')} V-Bucks (~${request.totalMxn.toFixed(2)} MXN)`)

  return lines.join('\n')
}

export function getWhatsappNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
}

export function buildWhatsappUrl(message: string, number?: string): string {
  const phone = (number ?? getWhatsappNumber()).replace(/[^\d]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
