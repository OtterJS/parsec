import { getRead } from '@/get-read'
import type { HasBody, NextFunction, Request, Response } from '@/types'
import { hasNoBody } from '@/utils/has-no-body'

export const text = () => {
  const read = getRead((x) => x.toString())
  return async (req: Request & HasBody<string>, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
