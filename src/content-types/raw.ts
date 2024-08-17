import { getRawRead } from '@/get-read'
import type { HasBody, MaybeParsed, NextFunction, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'

export const raw = () => {
  const read = getRawRead()
  return async (req: Request & HasBody<Buffer> & MaybeParsed, res: Response, next: NextFunction) => {
    if (req[alreadyParsed] === true) return next()
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
