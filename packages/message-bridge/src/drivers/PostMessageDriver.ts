import BaseDriver, { type Message } from './BaseDriver'

// Protocol identifier to distinguish MessageBridge messages from user-initiated postMessages
const MESSAGE_BRIDGE_PROTOCOL = 'message-bridge-v1'

export interface BridgeMessage extends Message {
  __messageBridge: typeof MESSAGE_BRIDGE_PROTOCOL
}

function isBridgeMessage(data: unknown): data is BridgeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    '__messageBridge' in data &&
    (data as Record<string, unknown>).__messageBridge === MESSAGE_BRIDGE_PROTOCOL
  )
}

export default class PostMessageDriver extends BaseDriver {
  targetWindow: Window
  targetOrigin: string
  constructor(targetWindow: Window, targetOrigin: string) {
    super()

    if (!targetOrigin || targetOrigin === '*') {
      throw new Error(
        'PostMessageDriver requires explicit targetOrigin for security. Do not use "*" as it allows any origin.',
      )
    }

    this.targetWindow = targetWindow
    this.targetOrigin = targetOrigin

    window.addEventListener('message', (event) => {
      if (event.origin !== this.targetOrigin) {
        return
      }
      // Only process messages that are from MessageBridge protocol
      if (!isBridgeMessage(event.data)) {
        return
      }
      // Strip the protocol identifier before passing to the bridge
      const { __messageBridge, ...message } = event.data
      this.onMessage?.(message as Message)
    })
  }

  send(data: Message) {
    const bridgeMessage: BridgeMessage = {
      ...data,
      __messageBridge: MESSAGE_BRIDGE_PROTOCOL,
    }
    this.targetWindow.postMessage(bridgeMessage, this.targetOrigin)
  }
}
