import { ContentType } from '@otterhttp/content-type'

import { type ReadOptions, getRead } from '@/get-read'
import type { MaybeParsed, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'
import { typeChecker } from '@/utils/type-checker'

export type TextBodyParsingOptions<
  Req extends Request = Request,
  Res extends Response<Req> = Response<Req>,
> = ReadOptions & {
  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match requests with Content-Type `text/plain`, `text/foo+html`, etc.
   *
   * @default typeChecker("text/*")
   */
  matcher?: (req: Req, res: Res) => boolean
}

export function makeText<Req extends Request = Request, Res extends Response<Req> = Response<Req>>(
  options?: TextBodyParsingOptions<Req, Res>,
) {
  const optionsCopy: ReadOptions = Object.assign({}, options)
  optionsCopy.limit ??= '100kb'
  optionsCopy.inflate ??= true

  const matcher = options?.matcher ?? typeChecker(ContentType.parse('text/*'))

  const read = getRead((x) => x.toString(), optionsCopy)
  return async (req: Req & MaybeParsed, res: Res): Promise<string | undefined> => {
    if (req[alreadyParsed] === true) return undefined
    if (hasNoBody(req.method)) return undefined
    if (!matcher(req, res)) return undefined
    return await read(req, res)
  }
}
