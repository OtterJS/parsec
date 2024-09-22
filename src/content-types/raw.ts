import { type RawReadOptions, getRawRead } from '@/get-read'
import type { MaybeParsed, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'

export type RawBodyParsingOptions<
  Req extends Request = Request,
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

export function makeRaw<Req extends Request = Request, Res extends Response<Req> = Response<Req>>(
  options?: RawBodyParsingOptions<Req, Res>,
) {
  const optionsCopy: RawReadOptions = Object.assign({}, options)
  optionsCopy.limit ??= '100kb'
  optionsCopy.inflate ??= true

  const matcher = options?.matcher ?? (() => true)

  const read = getRawRead(options)
  return async (req: Req & MaybeParsed, res: Res): Promise<Buffer | undefined> => {
    if (req[alreadyParsed] === true) return undefined
    if (hasNoBody(req.method)) return undefined
    if (!matcher(req, res)) return undefined
    return await read(req, res)
  }
}
