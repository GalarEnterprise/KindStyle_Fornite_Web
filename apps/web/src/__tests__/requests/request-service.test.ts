import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn() },
    cartItem: { findMany: vi.fn(), deleteMany: vi.fn() },
    product: { findMany: vi.fn() },
    request: { count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
    requestItem: { createMany: vi.fn() },
    currencySetting: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { db } from '@/lib/db/client'
import {
  generateRequestNumber,
  markWhatsappOpened,
  deleteRequest,
} from '@/lib/services/requests/request-service'

const mockDb = vi.mocked(db, true)

describe('generateRequestNumber', () => {
  const mockTx = () => ({
    request: {
      count: mockDb.request.count,
      findUnique: mockDb.request.findUnique,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('genera formato REQ-YYYYMMDD-XXXX con padding a 4 dígitos', async () => {
    mockDb.request.count.mockResolvedValue(0)
    mockDb.request.findUnique.mockResolvedValue(null)

    const number = await generateRequestNumber(mockTx() as never, new Date('2026-08-25T12:00:00Z'))

    expect(number).toMatch(/^REQ-\d{8}-\d{4}$/)
    expect(number).toBe('REQ-20260825-0001')
  })

  it('incrementa el secuencial según los requests existentes del día', async () => {
    mockDb.request.count.mockResolvedValue(7)
    mockDb.request.findUnique.mockResolvedValue(null)

    const number = await generateRequestNumber(mockTx() as never, new Date('2026-08-25T12:00:00Z'))

    expect(number).toBe('REQ-20260825-0008')
  })

  it('reintenta ante colisión de número existente', async () => {
    mockDb.request.count.mockResolvedValue(0)
    mockDb.request.findUnique
      .mockResolvedValueOnce({ id: 'x', request_number: 'REQ-20260825-0001' } as never)
      .mockResolvedValueOnce(null)

    const number = await generateRequestNumber(mockTx() as never, new Date('2026-08-25T12:00:00Z'))

    expect(number).toBe('REQ-20260825-0002')
  })
})

describe('markWhatsappOpened', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza solicitud ajena o inexistente con REQUEST_NOT_FOUND', async () => {
    mockDb.request.findFirst.mockResolvedValue(null)

    const result = await markWhatsappOpened('user-1', 'no-existe')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('REQUEST_NOT_FOUND')
  })

  it('es idempotente si ya fue abierta por WhatsApp', async () => {
    mockDb.request.findFirst.mockResolvedValue({
      id: 'req-1',
      status: 'WHATSAPP_OPENED',
      whatsapp_opened_at: new Date(),
      user_id: 'user-1',
    } as never)

    const result = await markWhatsappOpened('user-1', 'req-1')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.alreadyOpened).toBe(true)
    expect(mockDb.request.update).not.toHaveBeenCalled()
  })

  it('registra apertura y mueve CREATED → WHATSAPP_OPENED', async () => {
    mockDb.request.findFirst.mockResolvedValue({
      id: 'req-1',
      status: 'CREATED',
      whatsapp_opened_at: null,
      user_id: 'user-1',
    } as never)
    mockDb.request.update.mockResolvedValue({} as never)

    const result = await markWhatsappOpened('user-1', 'req-1')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.alreadyOpened).toBe(false)
    expect(mockDb.request.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: 'WHATSAPP_OPENED' }),
    })
  })
})

describe('deleteRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('elimina una solicitud propia y devuelve éxito', async () => {
    mockDb.request.findFirst.mockResolvedValue({
      id: 'req-1',
      user_id: 'user-1',
    } as never)
    mockDb.request.delete.mockResolvedValue({ id: 'req-1' } as never)

    const result = await deleteRequest('user-1', 'req-1')

    expect(result.success).toBe(true)
    expect(mockDb.request.delete).toHaveBeenCalledWith({ where: { id: 'req-1' } })
  })

  it('no elimina una solicitud ajena (404)', async () => {
    mockDb.request.findFirst.mockResolvedValue(null)

    const result = await deleteRequest('user-1', 'req-ajena')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('REQUEST_NOT_FOUND')
    expect(mockDb.request.delete).not.toHaveBeenCalled()
  })

  it('no elimina una solicitud inexistente (404)', async () => {
    mockDb.request.findFirst.mockResolvedValue(null)

    const result = await deleteRequest('user-1', 'no-existe')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('REQUEST_NOT_FOUND')
    expect(mockDb.request.delete).not.toHaveBeenCalled()
  })
})
