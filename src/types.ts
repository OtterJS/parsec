import type { IncomingMessage, ServerResponse } from 'node:http'

export type NextFunction = () => void

// Extend the request object with body
export type HasBody<T = unknown> = {
  body?: T
}

export type Request = IncomingMessage
export type Response<Request extends IncomingMessage = IncomingMessage> = ServerResponse<Request>
