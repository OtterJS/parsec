import { getRead } from '@/get-read'
import type { HasBody, NextFunction, Request, Response } from '@/types'

export const custom = <T = unknown>(fn: (body: string) => T) => {
  const read = getRead(fn)
  return async (req: Request & HasBody<T>, res: Response, next: NextFunction) => {
    req.body = await read(req, res)
    next()
  }
}
