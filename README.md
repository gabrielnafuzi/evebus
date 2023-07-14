# evebus

Evebus is a lightweight, flexible event bus library designed to facilitate communication between components or services in JavaScript applications. With TypeScript support and a simple-to-use API.

<a href="https://www.npmjs.org/package/evebus"><img src="https://img.shields.io/npm/v/evebus.svg" alt="npm"></a>
<img src="https://github.com/gabrielnafuzi/evebus/workflows/CI/badge.svg" alt="build status">
<a href="https://unpkg.com/evebus/dist/evebus.js"><img src="https://img.badgesize.io/https://unpkg.com/evebus/dist/index.js?compression=gzip&label=gzip" alt="gzip size"></a>
<img src="https://img.shields.io/github/languages/top/gabrielnafuzi/evebus" alt="GitHub top language" />

## Features

- **Easy to use API**: evebus offers straightforward functions to manage event listeners and dispatch events.
- **TypeScript Support**: Strongly typed event keys and payloads for a robust development experience.
- **Unsubscribe Capabilities**: Each listener can be easily unsubscribed.
- **Wildcard Support**: Listen to all events with a special wildcard key.
- **Once Event Support**: Listeners can be set to listen to an event only once.
- **Flexible**: evebus is unopinionated, meaning it can fit nicely into any project, regardless of architecture or existing libraries.

## Install

To install the evebus library, you can use npm, yarn, or pnpm:

```bash
# npm
npm install evebus
# yarn
yarn add evebus
# pnpm
pnpm add evebus
```

## Usage

Getting started with evebus is straightforward. Below are some basic and advanced patterns to help you get started.

### Basic Usage

Start by importing `evebus` and initializing an event bus:

```ts
import { evebus } from 'evebus'

const bus = evebus()
```

#### Listening to an event

You can listen to any event using the `on` method and passing it an event name and a callback:

```ts
const unsubscribe = bus.on('some-event', (data) => {
  console.log(data)
})
```

#### Emitting an event

You can trigger an event using the `emit` method:

```ts
bus.emit('some-event', 'some data')
```

#### Unsubscribing from an event

To unsubscribe from an event, simply invoke the function returned by the `on` method:

```ts
unsubscribe()
```

### Advanced Usage

evebus also provides a few advanced features.

#### Wildcard Listeners

To listen to all events, you can use a wildcard '\*':

```ts
bus.on('*', (event, data) => {
  console.log(event, data)
})
```

#### Clearing all events

You can clear all events from all listeners using the `off` method with no arguments:

```ts
bus.off() // or bus.all.clear()
```

#### Removing specific listeners

You can remove a specific listener from an event:

```ts
const handler = () => {
  console.log('some-event')
}

bus.on('some-event', handler)
bus.off('some-event', handler)
```

#### Listening to an event only once

Listeners can be set to listen to an event only once:

```ts
bus.once('some-event', (data) => {
  console.log(data)
})
```

#### Configuration Options

When creating an event bus using `evebus`, you can pass an optional configuration object with the following options:

- `initialEvents`: An `EventHandlerMap` containing the initial events and their corresponding event handlers. This allows you to set up predefined events when creating the event bus. By default, if no initial events are provided, the event bus will start with an empty set of events. Example usage:

  ```ts
  import { evebus } from 'evebus'

  const initialEvents = new Map([
    ['some-event', new Set([handler1, handler2])],
    ['another-event', new Set([handler3])],
  ])

  const bus = evebus({ initialEvents })
  ```

- `onError`: A function that will be called when an error occurs in any event handler. This allows you to provide a centralized error handling mechanism for your event bus. Example usage:

  ```ts
  import { evebus } from 'evebus'

  const bus = evebus({
    onError: (error) => {
      // Handle the error
      console.error(error)
    },
  })
  ```

### TypeScript Support

evebus has robust TypeScript support. Define your event keys and payloads to take advantage of this:

```ts
import { evebus } from 'evebus'

type Events = {
  'some-event': string
  'another-event': number
}

const bus = evebus<Events>()

bus.on('some-event', (data) => {
  // data is inferred as `string`
})

bus.emit('some-event', 'some data')
bus.emit('another-event', 'some data') // Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

## Contribute

Contributions to evebus are always welcome! If you find a bug or have an idea for a new feature, feel free to open an issue or submit a pull request. Every contribution helps make evebus a better tool for everyone.

## License

[MIT License](https://opensource.org/licenses/MIT) © [Gabriel Moraes](https://github.com/gabrielnafuzi)
