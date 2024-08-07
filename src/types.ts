import type { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'

export type NextFunction = () => void

// Extend the request object with body
export type ReqWithBody<T = any> = IncomingMessage & {
  body?: T
} & EventEmitter

export type Response = ServerResponse<ReqWithBody>
