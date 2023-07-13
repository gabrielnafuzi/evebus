/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { evebus } from '../src'

interface PlayerEvent {
  player: string
}

interface ScoreEvent {
  score: number
}

const bus = evebus<{
  levelUp: string
  lifeLost?: number
  playerEvent: PlayerEvent
  scoreEvent: ScoreEvent
}>()

// @ts-ignore - ignore unused vars
const levelUpHandler = (x: string) => {}
// @ts-ignore - ignore unused vars
const lifeLostHandler = (x?: number) => {}
// @ts-ignore - ignore unused vars
const playerEventHandler = (x: PlayerEvent) => {}
// @ts-ignore - ignore unused vars
const scoreEventHandler = (x: ScoreEvent) => {}

const wildcardHandler = (
  _type: 'levelUp' | 'lifeLost' | 'playerEvent' | 'scoreEvent',
  _event: string | PlayerEvent | ScoreEvent | number | undefined,
) => {}

/*
 * Check that 'on' args are inferred correctly
 */
{
  bus.on('levelUp', levelUpHandler)
  bus.on('lifeLost', lifeLostHandler)
  bus.on('playerEvent', playerEventHandler)
  bus.on('scoreEvent', scoreEventHandler)

  // @ts-expect-error
  bus.on('levelUp', playerEventHandler)
  bus.on('*', wildcardHandler)
}

/*
 * Check that 'off' args are inferred correctly
 */
{
  bus.off('levelUp', levelUpHandler)
  bus.off('lifeLost', lifeLostHandler)
  bus.off('playerEvent', playerEventHandler)
  bus.off('scoreEvent', scoreEventHandler)

  // @ts-expect-error
  bus.off('scoreEvent', playerEventHandler)
  bus.off('*', wildcardHandler)
}

/*
 * Check that 'emit' args are inferred correctly
 */
{
  bus.emit('playerEvent', { player: 'John' })
  bus.emit('levelUp', 'level2')
  bus.emit('lifeLost')
  bus.emit('lifeLost', 1)
  bus.emit('scoreEvent', { score: 5000 })

  // @ts-expect-error
  bus.emit('levelUp', { player: 'John' })
  // @ts-expect-error
  bus.emit('playerEvent', 'level2')
  // @ts-expect-error
  bus.emit('lifeLost', 'life1')
  // @ts-expect-error
  bus.emit('scoreEvent', 1000)
}
