import { getRead } from '@/get-read'
import type { HasBody, MaybeParsed, NextFunction, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'

export const custom = <T = unknown>(fn: (body: string) => T) => {
  const read = getRead(fn)
  return async (req: Request & HasBody<T> & MaybeParsed, res: Response, next: NextFunction) => {
    if (req[alreadyParsed] === true) return next()
    req.body = await read(req, res)
    next()
  }
}
