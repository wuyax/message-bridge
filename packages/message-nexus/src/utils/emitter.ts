import mitt, { type Emitter } from 'mitt'
import type { Message } from '../drivers/BaseDriver'

export { type Emitter }

export function createEmitter() {
  return mitt<Record<string, Message>>()
}
