import { evebus, EventBus } from '../src'
import { expect, test, describe, vi, beforeEach } from 'vitest'

describe('eventbus', () => {
  const eventKeyAsSymbol = Symbol('event1')
  type TestEvents = {
    event1: string
    event2: number
    event3: boolean
    [eventKeyAsSymbol]: string
  }

  let bus: EventBus<TestEvents>

  beforeEach(() => {
    bus = evebus<TestEvents>()
  })

  test('accept initial bus', () => {
    const initialBus = new Map()
    const mockHandler = vi.fn()
    const mockHandler2 = vi.fn()
    initialBus.set('event1', new Set([mockHandler, mockHandler2]))

    const bus = evebus<{ event1: string }>({ initialEvents: initialBus })

    bus.emit('event1', 'hello')

    expect(bus.all).toBe(initialBus)
    expect(mockHandler).toHaveBeenCalledWith('hello')
    expect(mockHandler2).toHaveBeenCalledWith('hello')
  })

  test('on and emit', () => {
    const mockHandler = vi.fn()
    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')
    expect(mockHandler).toHaveBeenCalledWith('hello')
  })

  test('accepts symbol as event key', () => {
    const mockHandler = vi.fn()

    bus.on(eventKeyAsSymbol, mockHandler)
    bus.emit(eventKeyAsSymbol, 'hello')

    expect(mockHandler).toHaveBeenCalledWith('hello')
  })

  test('off', () => {
    const mockHandler = vi.fn()

    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')
    bus.off('event1', mockHandler)
    bus.emit('event1', 'world')

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith('hello')
  })

  test('off() clears all handlers', () => {
    const mockHandler = vi.fn()
    const mockHandler2 = vi.fn()
    const mockHandler3 = vi.fn()

    bus.on('event1', mockHandler)
    bus.on('event2', mockHandler2)
    bus.on('event3', mockHandler3)

    bus.emit('event1', 'hello')
    bus.emit('event2', 42)
    bus.emit('event3', true)

    bus.off()

    bus.emit('event1', 'world')
    bus.emit('event2', 43)
    bus.emit('event3', false)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith('hello')
    expect(mockHandler2).toHaveBeenCalledTimes(1)
    expect(mockHandler2).toHaveBeenCalledWith(42)
    expect(mockHandler3).toHaveBeenCalledTimes(1)
    expect(mockHandler3).toHaveBeenCalledWith(true)
  })

  test('once', () => {
    const mockHandler = vi.fn()

    bus.once('event2', mockHandler)
    bus.emit('event2', 42)
    bus.emit('event2', 43)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(42)
  })

  test('wildcard on and emit', () => {
    const mockHandler = vi.fn()

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.emit('event2', 42)

    expect(mockHandler).toHaveBeenCalledTimes(2)
    expect(mockHandler).toHaveBeenCalledWith('event1', 'hello')
    expect(mockHandler).toHaveBeenCalledWith('event2', 42)
  })

  test("call onError when it's provided", () => {
    const mockErrorHandler = vi.fn()
    const mockHandler = vi.fn(() => {
      throw new Error('test error')
    })

    const bus = evebus<TestEvents>({
      onError: mockErrorHandler,
    })

    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')

    expect(mockErrorHandler).toHaveBeenCalledWith(new Error('test error'))
  })

  test('wildcard off', () => {
    const mockHandler = vi.fn()

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.off('*', mockHandler)
    bus.emit('event1', 'world')

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith('event1', 'hello')
  })

  test('multiple handlers', () => {
    const mockHandler1 = vi.fn()
    const mockHandler2 = vi.fn()

    bus.on('event1', mockHandler1)
    bus.on('event1', mockHandler2)

    bus.emit('event1', 'hello')

    expect(mockHandler1).toHaveBeenCalledWith('hello')
    expect(mockHandler2).toHaveBeenCalledWith('hello')
  })

  test('handler removal with off without handler', () => {
    const mockHandler1 = vi.fn()
    const mockHandler2 = vi.fn()

    bus.on('event1', mockHandler1)
    bus.on('event1', mockHandler2)

    bus.emit('event1', 'hello')
    bus.off('event1')
    bus.emit('event1', 'world')

    expect(mockHandler1).toHaveBeenCalledTimes(1)
    expect(mockHandler1).toHaveBeenCalledWith('hello')
    expect(mockHandler2).toHaveBeenCalledTimes(1)
    expect(mockHandler2).toHaveBeenCalledWith('hello')
  })

  test('wildcard handler with multiple events', () => {
    const mockHandler = vi.fn()

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.emit('event2', 42)
    bus.emit('event3', true)

    expect(mockHandler).toHaveBeenCalledTimes(3)
    expect(mockHandler).toHaveBeenCalledWith('event1', 'hello')
    expect(mockHandler).toHaveBeenCalledWith('event2', 42)
    expect(mockHandler).toHaveBeenCalledWith('event3', true)
  })

  test('once with multiple calls', () => {
    const mockHandler = vi.fn()

    bus.once('event2', mockHandler)
    bus.emit('event2', 42)
    bus.emit('event2', 43)
    bus.emit('event2', 44)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(42)
  })
})
