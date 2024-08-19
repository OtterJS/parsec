import { type RawReadOptions, getRawRead } from '@/get-read'
import type { HasBody, MaybeParsed, NextFunction, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'

export type RawBodyParsingOptions<
  Req extends Request & HasBody<Buffer> = Request & HasBody<Buffer>,
  Res extends Response<Req> = Response<Req>,
> = RawReadOptions & {
  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match all requests.
   *
   * @default () => true
   */
  matcher?: (req: Req, res: Res) => boolean
}

export function raw<
  Req extends Request & HasBody<Buffer> = Request & HasBody<Buffer>,
  Res extends Response<Req> = Response<Req>,
>(options: RawBodyParsingOptions<Req, Res>) {
  const optionsCopy: RawReadOptions = Object.assign({}, options)
  optionsCopy.limit ??= '100kb'
  optionsCopy.inflate ??= true

  const matcher = options?.matcher ?? (() => true)

  const read = getRawRead<Buffer>(options)
  return async (req: Req & MaybeParsed, res: Res, next: NextFunction) => {
    if (req[alreadyParsed] === true) return next()
    if (hasNoBody(req.method)) return next()
    if (!matcher(req, res)) return next()
    req.body = await read(req, res)
    next()
  }
}
