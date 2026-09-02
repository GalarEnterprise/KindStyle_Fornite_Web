import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { copyToClipboard } from '@/lib/utils/copy'

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    })
  })

  it('usa navigator.clipboard.writeText en contexto seguro', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const result = await copyToClipboard('hola')

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hola')
  })

  it('usa fallback execCommand cuando navigator.clipboard no está disponible', async () => {
    const execCommand = vi.fn().mockReturnValue(true)
    const appendChild = vi.fn()
    const removeChild = vi.fn()

    ;(globalThis as Record<string, unknown>).document = {
      createElement: () => ({
        value: '',
        setAttribute: vi.fn(),
        style: {},
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      }),
      body: { appendChild, removeChild },
      execCommand,
    }

    const result = await copyToClipboard('hola')

    expect(result).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(appendChild).toHaveBeenCalledTimes(1)
    expect(removeChild).toHaveBeenCalledTimes(1)
  })

  it('devuelve false cuando todos los mecanismos fallan', async () => {
    ;(globalThis as Record<string, unknown>).document = {
      createElement: () => ({
        value: '',
        setAttribute: vi.fn(),
        style: {},
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      execCommand: vi.fn().mockReturnValue(false),
    }

    const result = await copyToClipboard('hola')

    expect(result).toBe(false)
  })
})