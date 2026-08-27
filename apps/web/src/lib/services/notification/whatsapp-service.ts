const WHATSAPP_TEMPLATES: Record<string, (m: Record<string, unknown>) => string> = {
  TIMER_STARTED: (m) =>
    `🟢 Bot preparado\n\nEl Bot ${m.bot_name ?? 'Bot'} ya está agregado a tu cuenta.\nTu período de espera ha comenzado.\n\n📅 Fecha de disponibilidad: ${m.eligibility_date ?? 'N/A'}\n⏱ Tiempo restante: ${m.remaining_time ?? 'N/A'}`,
  TIMER_COMPLETED: (m) =>
    `✅ Bot elegible\n\nTu bot ${m.bot_name ?? 'Bot'} ya es elegible para enviarte regalos.\nYa podemos proceder con tu solicitud.`,
  PAYMENT_VALIDATED: (m) =>
    `💰 Pago confirmado\n\nTu pedido ${m.request_number ?? 'N/A'} ha sido confirmado.\nMonto: $${m.amount ?? '0'} MXN`,
  PAYMENT_REJECTED: (m) =>
    `❌ Pago no válido\n\nTu pago no pudo ser validado.\nMotivo: ${m.reason ?? 'No especificado'}\n\nPor favor, sube un nuevo comprobante.`,
  FRIENDSHIP_CONFIRMED: (m) =>
    `🤝 Amistad confirmada\n\nTu amistad con ${m.bot_name ?? 'Bot'} ha sido confirmada.\nEl período de espera ha comenzado.`,
}

export function generateWhatsAppLink(
  phone: string,
  event: string,
  metadata?: Record<string, unknown>
): string {
  const template = WHATSAPP_TEMPLATES[event]
  const message = template ? template(metadata ?? {}) : `Notificación KindStyle: ${event}`
  const cleanPhone = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}
