import type { IncomingMessage, ServerResponse } from 'node:http'
import { alreadyParsed } from '@/utils/already-parsed-symbol'

export type NextFunction = () => void

// Extend the request object with body
export type HasBody<T = unknown> = {
  body?: T
}

export type MaybeParsed = {
  [alreadyParsed]?: true
}

export type Request = IncomingMessage
export type Response<Request extends IncomingMessage = IncomingMessage> = ServerResponse<Request>
