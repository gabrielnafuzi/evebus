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
  all: EventHandlerMap<Events>

  on<Key extends keyof Events>(
    key: Key,
    handler: EventHandler<Events[Key]>,
  ): Unsubscribe
  on(key: WildcardKey, handler: WildcardEventHandler<Events>): Unsubscribe

  off<Key extends keyof Events>(
    key: Key,
    handler?: EventHandler<Events[Key]>,
  ): void
  off(key: WildcardKey, handler?: WildcardEventHandler<Events>): void
  off(): void

  emit<Key extends keyof Events>(key: Key, payload: Events[Key]): void
  emit<Key extends keyof Events>(
    key: undefined extends Events[Key] ? Key : never,
  ): void

  once<Key extends keyof Events>(
    key: Key,
    handler: EventHandler<Events[Key]>,
  ): Unsubscribe
}

export type EveBusConfig<Events extends Record<EventKey, unknown>> = {
  initialEvents?: EventHandlerMap<Events>
  onError?: (error: unknown) => void
}

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
    const wildcardHandlersCopy = [...(wildcardHandlers ?? [])]

    if (handlers) {
      const handlersCopy = [...handlers]
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
