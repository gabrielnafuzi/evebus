/// <reference lib="ESNext" />

export type EventKey = string | symbol
export type EventHandler<T = unknown> = (event: T) => void
export type WildcardEventHandler<Events = Record<string, unknown>> = (
  key: keyof Events,
  event: Events[keyof Events],
) => void
export type EventHandlerList<T = unknown> = Set<EventHandler<T>>
export type WildcardEventHandlerList<Events = Record<string, unknown>> = Set<
  WildcardEventHandler<Events>
>
export type WildcardKey = '*'
export type EventHandlerMap<Events extends Record<EventKey, unknown>> = Map<
  keyof Events | WildcardKey,
  EventHandlerList<Events[keyof Events]> | WildcardEventHandlerList<Events>
>

export type Unsubscribe = () => void

export interface EventBus<Events extends Record<EventKey, unknown>> {
  /**
   * The map of all registered event handlers.
   *
   * The keys of this map are event keys, and the values are sets of handlers for the corresponding event.
   * A special wildcard key '*' represents handlers that listen to all events.
   */
  all: EventHandlerMap<Events>

  /**
   * Register an event handler for a specific event or for all events (using wildcard '*').
   *
   * @param {Key | WildcardKey} key - The event to listen to. Use '*' to listen to all events.
   * @param {GenericEventHandler} handler - The handler to call when the event is emitted.
   *
   * @returns {Unsubscribe} Function to unsubscribe this handler.
   */
  on<Key extends keyof Events>(
    key: Key,
    handler: EventHandler<Events[Key]>,
  ): Unsubscribe
  on(key: WildcardKey, handler: WildcardEventHandler<Events>): Unsubscribe

  /**
   * Unregister an event handler for a specific event.
   *
   * @param {Key} key - The event to stop listening to.
   * @param {GenericEventHandler} handler - The handler to unregister.
   *
   * If handler is omitted, all handlers for this event will be removed.
   * If key is omitted, all handlers for all events will be removed.
   */
  off<Key extends keyof Events>(
    key: Key,
    handler?: EventHandler<Events[Key]>,
  ): void
  off(key: WildcardKey, handler?: WildcardEventHandler<Events>): void
  off(): void

  /**
   * Emit an event, calling all registered handlers for this event.
   *
   * @param {Key} key - The event to emit.
   * @param {Events[Key]} payload - The payload to pass to the handlers.
   */
  emit<Key extends keyof Events>(key: Key, payload: Events[Key]): void
  emit<Key extends keyof Events>(
    key: undefined extends Events[Key] ? Key : never,
  ): void

  /**
   * Register a one-time event handler for a specific event.
   *
   * The handler will be called the next time the event is emitted, and then unregistered.
   *
   * @param {Key} key - The event to listen to.
   * @param {EventHandler<Events[Key]>} handler - The handler to call when the event is emitted.
   *
   * @returns {Unsubscribe} Function to unsubscribe this handler.
   */
  once<Key extends keyof Events>(
    key: Key,
    handler: EventHandler<Events[Key]>,
  ): Unsubscribe
}

export type EveBusConfig<Events extends Record<EventKey, unknown>> = {
  initialEvents?: EventHandlerMap<Events>
  onError?: (error: unknown) => void
}

/**
 * Create an EventBus instance with the provided configuration.
 *
 * @template Events - Record of events that this bus handles.
 *
 * @param {EveBusConfig<Events>} config - Configuration object for the EventBus.
 *   - initialEvents: Initial state of the EventBus.
 *   - onError: Error handler for any errors that occur while executing event handlers.
 *
 * @example
 * const bus = evebus<MyEvents>({
 *   onError: (error) => console.error(`An error occurred: ${error}`)
 * })
 *
 * bus.on('myEvent', (event) => console.log(event))
 * bus.emit('myEvent', 'Hello, World!')
 */
export function evebus<Events extends Record<EventKey, unknown>>(
  config?: EveBusConfig<Events>,
): EventBus<Events> {
  type GenericEventHandler =
    | EventHandler<Events[keyof Events]>
    | WildcardEventHandler<Events>

  const bus = config?.initialEvents ?? (new Map() as EventHandlerMap<Events>)

  const off = <Key extends keyof Events>(
    key?: Key,
    handler?: GenericEventHandler,
  ): void => {
    if (!key) {
      bus.clear()

      return
    }

    const handlers = bus.get(key) as Set<GenericEventHandler>

    if (!handlers) {
      return
    }

    if (handler) {
      handlers.delete(handler)
    } else {
      handlers.clear()
    }
  }

  const on = <Key extends keyof Events>(
    key: Key,
    handler: GenericEventHandler,
  ): Unsubscribe => {
    const handlers = bus.get(key) as Set<GenericEventHandler>

    if (handlers) {
      handlers.add(handler)
    } else {
      bus.set(key, new Set([handler]) as EventHandlerList<Events[keyof Events]>)
    }

    return () => {
      off(key, handler)
    }
  }

  const emit = <Key extends keyof Events>(
    key: Key,
    payload?: Events[Key],
  ): void => {
    const handlers = bus.get(key) as EventHandlerList<Events[Key]>
    const wildcardHandlers = bus.get('*') as WildcardEventHandlerList<Events>

    const wildcardHandlersCopy = wildcardHandlers
      ? Array.from(wildcardHandlers)
      : []

    if (handlers) {
      const handlersCopy = Array.from(handlers)

      handlersCopy.forEach((handler) => {
        try {
          handler(payload!)
        } catch (error) {
          config?.onError?.(error)
        }
      })
    }

    if (wildcardHandlers) {
      wildcardHandlersCopy.forEach((handler) => {
        try {
          handler(key, payload!)
        } catch (error) {
          config?.onError?.(error)
        }
      })
    }
  }

  const once = <Key extends keyof Events>(
    key: Key,
    handler: EventHandler<Events[Key]>,
  ): Unsubscribe => {
    const handleOnce = (payload: Events[Key]) => {
      handler(payload)
      off(key, handleOnce as GenericEventHandler)
    }

    return on(key, handleOnce as GenericEventHandler)
  }

  return {
    all: bus,
    on,
    off,
    emit,
    once,
  }
}
