import type { IncomingMessage } from 'node:http'

export function isFinished(message: IncomingMessage) {
  if (!message.socket) return true
  if (!message.socket.readable) return true
  if (message.complete && !message.readable) return true
  return false
}
