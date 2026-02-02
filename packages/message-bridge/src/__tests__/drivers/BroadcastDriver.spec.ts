import { describe, it, expect, vi, beforeEach } from 'vitest'
import BroadcastDriver from '../../drivers/BroadcastDriver'

describe('BroadcastDriver', () => {
  let mockChannel: any

  beforeEach(() => {
    vi.restoreAllMocks()
    mockChannel = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    }
  })

  class MockBroadcastChannel {
    postMessage = mockChannel.postMessage
    addEventListener = mockChannel.addEventListener
    removeEventListener = mockChannel.removeEventListener
    close = mockChannel.close
  }

  it('should initialize with channel name', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

    const driver = new BroadcastDriver({ channel: 'test-channel' })
    expect(driver).toBeDefined()

    vi.unstubAllGlobals()
  })

  it('should throw error when channel is empty', () => {
    expect(() => new BroadcastDriver({ channel: '' })).toThrow(
      'BroadcastDriver requires a channel name',
    )
  })

  it('should throw error when channel is not provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => new BroadcastDriver({} as any)).toThrow('BroadcastDriver requires a channel name')
  })

  it('should send messages using BroadcastChannel', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

    const driver = new BroadcastDriver({ channel: 'test-channel' })
    driver.send({ id: 'test', type: 'test', from: 'sender' })

    expect(mockChannel.postMessage).toHaveBeenCalledWith({
      id: 'test',
      type: 'test',
      from: 'sender',
      __messageBridge: 'message-bridge-v1',
    })

    vi.unstubAllGlobals()
  })

  it('should call onMessage for messages with correct protocol', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

    const handler = vi.fn()
    const driver = new BroadcastDriver({ channel: 'test-channel' })
    driver.onMessage = handler

    // Simulate receiving a message
    const addCall = mockChannel.addEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'message',
    )
    const messageHandler = addCall?.[1] as (event: MessageEvent) => void

    if (messageHandler) {
      messageHandler({
        data: {
          id: 'test',
          type: 'test',
          from: 'sender',
          __messageBridge: 'message-bridge-v1',
        },
      } as MessageEvent)
    }

    expect(handler).toHaveBeenCalledWith({ id: 'test', type: 'test', from: 'sender' })

    vi.unstubAllGlobals()
  })

  it('should filter out messages without protocol', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

    const handler = vi.fn()
    const driver = new BroadcastDriver({ channel: 'test-channel' })
    driver.onMessage = handler

    // Simulate receiving a message without protocol
    const addCall = mockChannel.addEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'message',
    )
    const messageHandler = addCall?.[1] as (event: MessageEvent) => void

    if (messageHandler) {
      messageHandler({
        data: { id: 'test', type: 'test', from: 'sender' },
      } as MessageEvent)
    }

    expect(handler).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('should cleanup resources on destroy', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

    const driver = new BroadcastDriver({ channel: 'test-channel' })
    driver.destroy()

    expect(mockChannel.close).toHaveBeenCalled()
    expect(mockChannel.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))

    vi.unstubAllGlobals()
  })
})
