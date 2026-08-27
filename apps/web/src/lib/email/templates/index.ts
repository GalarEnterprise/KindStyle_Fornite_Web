interface EmailTemplate {
  subject: string
  html: string
}

export function getEmailTemplate(
  event: string,
  metadata?: Record<string, unknown>
): EmailTemplate | null {
  const templates: Record<string, (m: Record<string, unknown>) => EmailTemplate> = {
    TIMER_STARTED: timerStartedTemplate,
    TIMER_COMPLETED: timerCompletedTemplate,
    PAYMENT_VALIDATED: paymentValidatedTemplate,
    PAYMENT_REJECTED: paymentRejectedTemplate,
    FRIENDSHIP_CONFIRMED: friendshipConfirmedTemplate,
    NEW_ORDER: newOrderTemplate,
    RECEIPT_UPLOADED_ADMIN: receiptUploadedTemplate,
  }

  const generator = templates[event]
  if (!generator) return null

  return generator(metadata ?? {})
}

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #030712; color: #e5e7eb; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h1 style="color: #a855f7; font-size: 20px;">KindStyle</h1>
    ${content}
    <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">Equipo KindStyle</p>
  </div>
</body>
</html>`
}

function timerStartedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Tu bot ya está listo - KindStyle',
    html: baseLayout(`
      <p>Hola,</p>
      <p>Tu bot <strong>${m.bot_name ?? 'Bot'}</strong> ya ha sido agregado a tu cuenta de Fortnite.</p>
      <p>El período de espera ha comenzado:</p>
      <ul style="color: #9ca3af;">
        <li>📅 Fecha de disponibilidad: ${m.eligibility_date ?? 'N/A'}</li>
        <li>⏱ Tiempo restante: ${m.remaining_time ?? 'N/A'}</li>
      </ul>
    `),
  }
}

function timerCompletedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Tu bot es elegible - KindStyle',
    html: baseLayout(`
      <p>Hola,</p>
      <p>Tu bot <strong>${m.bot_name ?? 'Bot'}</strong> ya es elegible para enviarte regalos.</p>
      <p>Ya podemos proceder con tu solicitud.</p>
    `),
  }
}

function paymentValidatedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Pago confirmado - KindStyle',
    html: baseLayout(`
      <p>Hola,</p>
      <p>Tu pago ha sido confirmado.</p>
      <ul style="color: #9ca3af;">
        <li>Pedido: ${m.request_number ?? 'N/A'}</li>
        <li>Monto: $${m.amount ?? '0'} MXN</li>
      </ul>
    `),
  }
}

function paymentRejectedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Pago no válido - KindStyle',
    html: baseLayout(`
      <p>Hola,</p>
      <p>Tu pago no pudo ser validado.</p>
      <p style="color: #9ca3af;">Motivo: ${m.reason ?? 'No especificado'}</p>
      <p>Por favor, sube un nuevo comprobante para reintentar.</p>
    `),
  }
}

function friendshipConfirmedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Amistad confirmada - KindStyle',
    html: baseLayout(`
      <p>Hola,</p>
      <p>Tu amistad con <strong>${m.bot_name ?? 'Bot'}</strong> ha sido confirmada.</p>
      <p>El período de espera ha comenzado.</p>
    `),
  }
}

function newOrderTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Nuevo pedido - KindStyle',
    html: baseLayout(`
      <p>Nuevo pedido recibido:</p>
      <ul style="color: #9ca3af;">
        <li>Pedido: ${m.request_number ?? 'N/A'}</li>
        <li>Cliente: ${m.user_email ?? 'N/A'}</li>
        <li>Total: $${m.total_mxn ?? '0'} MXN</li>
      </ul>
    `),
  }
}

function receiptUploadedTemplate(m: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Comprobante subido - KindStyle',
    html: baseLayout(`
      <p>Un cliente ha subido un comprobante de pago:</p>
      <ul style="color: #9ca3af;">
        <li>Pedido: ${m.request_number ?? 'N/A'}</li>
        <li>Cliente: ${m.user_email ?? 'N/A'}</li>
      </ul>
      <p>Revisa el panel de administración para validar el pago.</p>
    `),
  }
}
