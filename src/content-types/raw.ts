import { getRawRead } from '@/get-read'
import type { HasBody, NextFunction, Request, Response } from '@/types'
import { hasNoBody } from '@/utils/has-no-body'

export const raw = () => {
  const read = getRawRead()
  return async (req: Request & HasBody<Buffer>, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
