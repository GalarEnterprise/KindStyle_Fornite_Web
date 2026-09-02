import { describe, it, expect } from 'vitest'
import { buildRequestMessage, buildWhatsappUrl } from '@/lib/services/requests/message-service'

const SAMPLE = {
  requestNumber: 'REQ-20260825-0001',
  nickname: 'PlayerOne',
  items: [
    { productName: 'Renegade Raider', quantity: 1, priceVbucks: 1200 },
    { productName: '1000 V-Bucks', quantity: 2, priceVbucks: 1000 },
  ],
  totalVbucks: 3200,
  totalMxn: 240.0,
}

describe('buildRequestMessage', () => {
  it('incluye número de solicitud, cliente y totales', () => {
    const message = buildRequestMessage(SAMPLE)

    expect(message).toContain('REQ-20260825-0001')
    expect(message).toContain('Cliente: PlayerOne')
    expect(message).toContain('Total: 3,200 V-Bucks')
    expect(message).toContain('240.00 MXN')
  })

  it('incluye cada producto con cantidad y precio', () => {
    const message = buildRequestMessage(SAMPLE)

    expect(message).toContain('- Renegade Raider x1 (1,200 V-Bucks)')
    expect(message).toContain('- 1000 V-Bucks x2 (1,000 V-Bucks)')
  })

  it('no incluye datos sensibles', () => {
    const message = buildRequestMessage({
      ...SAMPLE,
      nickname: 'PlayerOne',
    })

    expect(message.toLowerCase()).not.toContain('password')
    expect(message.toLowerCase()).not.toContain('contraseña')
    expect(message.toLowerCase()).not.toContain('credencial')
  })
})

describe('buildWhatsappUrl', () => {
  it('construye URL wa.me con mensaje URL-encoded', () => {
    const url = buildWhatsappUrl('hola mundo', '+523531022207')

    expect(url).toBe('https://wa.me/523531022207?text=hola%20mundo')
  })

  it('elimina caracteres no numéricos del teléfono', () => {
    const url = buildWhatsappUrl('test', '+52 (353) 102-2207')

    expect(url).toContain('https://wa.me/523531022207?text=')
  })

  it('codifica saltos de línea correctamente', () => {
    const url = buildWhatsappUrl('línea1\nlínea2', '+523531022207')

    expect(url).toContain('l%C3%ADnea1%0Al%C3%ADnea2')
  })
})
