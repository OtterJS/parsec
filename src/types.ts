import type { IncomingMessage, ServerResponse } from 'node:http'
import { alreadyParsed } from '@/utils/already-parsed-symbol'

export type MaybeParsed = {
  [alreadyParsed]?: true
}

export type Request = IncomingMessage
export type Response<Request extends IncomingMessage = IncomingMessage> = ServerResponse<Request>

// https://stackoverflow.com/a/76616671
export type Omit<T, K extends PropertyKey> = { [P in keyof T as Exclude<P, K>]: T[P] }
