import { getRead } from '@/get-read'
import type { MaybeParsed, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'

export const makeCustom = <T = unknown>(fn: (body: string) => T) => {
  const read = getRead(fn)
  return async (req: Request & MaybeParsed, res: Response): Promise<T | undefined> => {
    if (req[alreadyParsed] === true) return undefined
    if (hasNoBody(req.method)) return undefined
    return await read(req, res)
  }
}
