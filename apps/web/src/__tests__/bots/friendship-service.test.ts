import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    friendshipRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    friendshipRequestBot: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    fulfillmentAccount: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    eventLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { db } from '@/lib/db/client'
import {
  registerPlatform,
  addExtraBot,
  markRequestSent,
  confirmFriendship,
} from '@/lib/services/friendship/friendship-service'

const mockDb = vi.mocked(db, true)

function makeBotRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    friendship_request_id: 'fr-1',
    fulfillment_account_id: 'bot-1',
    request_status: 'PENDING',
    friendship_status: 'PENDING',
    request_sent_at: null,
    friendship_confirmed_at: null,
    eligibility_at: null,
    created_at: new Date('2026-08-25T10:00:00Z'),
    updated_at: new Date('2026-08-25T10:00:00Z'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerPlatform', () => {
  it('rechaza input inválido con VALIDATION_ERROR', async () => {
    const result = await registerPlatform('user-1', { platform: 'STEAM', platform_user_id: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('retorna existente sin duplicar si ya tiene solicitud activa', async () => {
    mockDb.friendshipRequest.findFirst.mockResolvedValue({ id: 'fr-1', status: 'PROCESSING' } as never)

    const result = await registerPlatform('user-1', { platform: 'EPIC', platform_user_id: 'Pablito123' })

    expect(result.success).toBe(true)
    expect(mockDb.friendshipRequest.create).not.toHaveBeenCalled()
  })

  it('responde NO_BOTS_AVAILABLE sin crear nada cuando faltan bots', async () => {
    mockDb.friendshipRequest.findFirst.mockResolvedValue(null)
    const txMock = {
      friendshipRequest: {
        create: mockDb.friendshipRequest.create,
        update: mockDb.friendshipRequest.update,
      },
      fulfillmentAccount: {
        findMany: mockDb.fulfillmentAccount.findMany,
        update: mockDb.fulfillmentAccount.update,
        fields: { capacity: 'capacity' },
      },
      eventLog: { create: mockDb.eventLog.create },
    }
    mockDb.$transaction.mockImplementation(async (fn) =>
      (fn as unknown as (tx: typeof txMock) => Promise<unknown>)(txMock)
    )
    mockDb.friendshipRequest.create.mockResolvedValue({ id: 'fr-1' } as never)
    mockDb.fulfillmentAccount.findMany.mockResolvedValue([])

    const result = await registerPlatform('user-1', { platform: 'EPIC', platform_user_id: 'Pablito123' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NO_BOTS_AVAILABLE')
  })
})

describe('addExtraBot', () => {
  it('rechaza si la solicitud no existe o es ajena', async () => {
    mockDb.friendshipRequest.findFirst.mockResolvedValue(null)

    const result = await addExtraBot('user-1', 'no-existe')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('rechaza ALREADY_COMPLETE si ya tiene todos los bots', async () => {
    mockDb.friendshipRequest.findFirst.mockResolvedValue({
      id: 'fr-1',
      user_id: 'user-1',
      required_bots: 2,
      bots: [makeBotRow(), makeBotRow({ id: 'row-2' })],
    } as never)

    const result = await addExtraBot('user-1', 'fr-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('ALREADY_COMPLETE')
  })
})

describe('markRequestSent', () => {
  it('es idempotente si ya fue enviada', async () => {
    mockDb.friendshipRequestBot.findUnique.mockResolvedValue({
      ...makeBotRow({ request_status: 'REQUEST_SENT', request_sent_at: new Date() }),
      friendship_request: { id: 'fr-1' },
    } as never)

    const result = await markRequestSent('admin-1', 'row-1')

    if (!result.success) throw new Error('debió ser exitoso')
    expect((result.data as { alreadySent: boolean }).alreadySent).toBe(true)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('registra REQUEST_SENT + evento FRIEND_REQUEST_SENT', async () => {
    mockDb.friendshipRequestBot.findUnique.mockResolvedValue({
      ...makeBotRow(),
      friendship_request: { id: 'fr-1' },
    } as never)
    mockDb.$transaction.mockResolvedValue([])
    mockDb.friendshipRequestBot.findMany.mockResolvedValue([
      makeBotRow({ request_status: 'REQUEST_SENT', request_sent_at: new Date() }),
    ] as never)

    const result = await markRequestSent('admin-1', 'row-1')

    if (!result.success) throw new Error('debió ser exitoso')
    expect((result.data as { alreadySent: boolean }).alreadySent).toBe(false)
    expect(mockDb.eventLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event_type: 'FRIEND_REQUEST_SENT' }) })
    )
  })
})

describe('confirmFriendship', () => {
  it('rechaza con REQUEST_NOT_SENT si no hay solicitud enviada', async () => {
    mockDb.friendshipRequestBot.findUnique.mockResolvedValue(makeBotRow() as never)

    const result = await confirmFriendship('admin-1', 'row-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('REQUEST_NOT_SENT')
  })

  it('es idempotente si ya confirmada', async () => {
    mockDb.friendshipRequestBot.findUnique.mockResolvedValue(
      makeBotRow({
        request_status: 'REQUEST_SENT',
        request_sent_at: new Date(),
        friendship_status: 'ACCEPTED',
        friendship_confirmed_at: new Date(),
      }) as never
    )

    const result = await confirmFriendship('admin-1', 'row-1')

    if (!result.success) throw new Error('debió ser exitoso')
    expect((result.data as { alreadyConfirmed: boolean }).alreadyConfirmed).toBe(true)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('registra ACCEPTED + evento FRIENDSHIP_CONFIRMED', async () => {
    mockDb.friendshipRequestBot.findUnique.mockResolvedValue(
      makeBotRow({ request_status: 'REQUEST_SENT', request_sent_at: new Date() }) as never
    )
    mockDb.$transaction.mockResolvedValue([])
    mockDb.friendshipRequestBot.findMany.mockResolvedValue([
      makeBotRow({
        request_status: 'REQUEST_SENT',
        request_sent_at: new Date(),
        friendship_status: 'ACCEPTED',
        friendship_confirmed_at: new Date(),
      }),
    ] as never)

    const result = await confirmFriendship('admin-1', 'row-1')

    if (!result.success) throw new Error('debió ser exitoso')
    expect((result.data as { alreadyConfirmed: boolean }).alreadyConfirmed).toBe(false)
    expect(mockDb.eventLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event_type: 'FRIENDSHIP_CONFIRMED' }) })
    )
  })
})
