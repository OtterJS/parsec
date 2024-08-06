import type { EventEmitter } from 'node:events'
import type { IncomingMessage } from 'node:http'

export type NextFunction = (err?: any) => void

// Extend the request object with body
export type ReqWithBody<T = any> = IncomingMessage & {
  body?: T
} & EventEmitter
