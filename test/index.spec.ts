import { expect, test, describe, beforeEach, mock } from 'bun:test'

import { evebus, type EventBus } from '../src'

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
    const mockHandler = mock(() => {})
    const mockHandler2 = mock(() => {})
    initialBus.set('event1', new Set([mockHandler, mockHandler2]))

    const bus = evebus<{ event1: string }>({ initialEvents: initialBus })

    bus.emit('event1', 'hello')

    expect(bus.all).toBe(initialBus)
    expect(mockHandler.mock.calls[0]).toEqual(['hello'])
    expect(mockHandler2.mock.calls[0]).toEqual(['hello'])
  })

  test('on and emit', () => {
    const mockHandler = mock(() => {})
    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')
    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  test('accepts symbol as event key', () => {
    const mockHandler = mock(() => {})

    bus.on(eventKeyAsSymbol, mockHandler)
    bus.emit(eventKeyAsSymbol, 'hello')

    expect(mockHandler.mock.calls[0]).toEqual(['hello'])
  })

  test('off', () => {
    const mockHandler = mock(() => {})

    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')
    bus.off('event1', mockHandler)
    bus.emit('event1', 'world')

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler.mock.calls[0]).toEqual(['hello'])
  })

  test('off() clears all handlers', () => {
    const mockHandler = mock(() => {})
    const mockHandler2 = mock(() => {})
    const mockHandler3 = mock(() => {})

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
    expect(mockHandler.mock.calls[0]).toEqual(['hello'])
    expect(mockHandler2).toHaveBeenCalledTimes(1)
    expect(mockHandler2.mock.calls[0]).toEqual([42])
    expect(mockHandler3).toHaveBeenCalledTimes(1)
    expect(mockHandler3.mock.calls[0]).toEqual([true])
  })

  test('once', () => {
    const mockHandler = mock(() => {})

    bus.once('event2', mockHandler)
    bus.emit('event2', 42)
    bus.emit('event2', 43)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler.mock.calls[0]).toEqual([42])
  })

  test('wildcard on and emit', () => {
    const mockHandler = mock(() => {})

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.emit('event2', 42)

    expect(mockHandler).toHaveBeenCalledTimes(2)
    expect(mockHandler.mock.calls[0]).toEqual(['event1', 'hello'])
    expect(mockHandler.mock.calls[1]).toEqual(['event2', 42])
  })

  test("call onError when it's provided", () => {
    const mockErrorHandler = mock(() => {})

    const mockHandler = mock(() => {
      throw new Error('test error')
    })

    const bus = evebus<TestEvents>({
      onError: mockErrorHandler,
    })

    bus.on('event1', mockHandler)
    bus.emit('event1', 'hello')

    expect(mockErrorHandler.mock.calls[0]).toEqual([new Error('test error')])
  })

  test('wildcard off', () => {
    const mockHandler = mock(() => {})

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.off('*', mockHandler)
    bus.emit('event1', 'world')

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler.mock.calls[0]).toEqual(['event1', 'hello'])
  })

  test('multiple handlers', () => {
    const mockHandler1 = mock(() => {})
    const mockHandler2 = mock(() => {})

    bus.on('event1', mockHandler1)
    bus.on('event1', mockHandler2)

    bus.emit('event1', 'hello')

    expect(mockHandler1.mock.calls[0]).toEqual(['hello'])
    expect(mockHandler2.mock.calls[0]).toEqual(['hello'])
  })

  test('handler removal with off without handler', () => {
    const mockHandler1 = mock(() => {})
    const mockHandler2 = mock(() => {})

    bus.on('event1', mockHandler1)
    bus.on('event1', mockHandler2)

    bus.emit('event1', 'hello')
    bus.off('event1')
    bus.emit('event1', 'world')

    expect(mockHandler1).toHaveBeenCalledTimes(1)
    expect(mockHandler1.mock.calls[0]).toEqual(['hello'])
    expect(mockHandler2).toHaveBeenCalledTimes(1)
    expect(mockHandler2.mock.calls[0]).toEqual(['hello'])
  })

  test('wildcard handler with multiple events', () => {
    const mockHandler = mock(() => {})

    bus.on('*', mockHandler)
    bus.emit('event1', 'hello')
    bus.emit('event2', 42)
    bus.emit('event3', true)

    expect(mockHandler).toHaveBeenCalledTimes(3)
    expect(mockHandler.mock.calls[0]).toEqual(['event1', 'hello'])
    expect(mockHandler.mock.calls[1]).toEqual(['event2', 42])
    expect(mockHandler.mock.calls[2]).toEqual(['event3', true])
  })

  test('once with multiple calls', () => {
    const mockHandler = mock(() => {})

    bus.once('event2', mockHandler)
    bus.emit('event2', 42)
    bus.emit('event2', 43)
    bus.emit('event2', 44)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler.mock.calls[0]).toEqual([42])
  })
})
