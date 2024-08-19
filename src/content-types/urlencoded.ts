import { type ParsedUrlQuery, parse } from 'node:querystring'
import { ContentType } from '@otterhttp/content-type'

import { type ReadOptions, getRead } from '@/get-read'
import type { HasBody, MaybeParsed, NextFunction, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { compose } from '@/utils/compose-functions'
import { ClientCharsetError } from '@/utils/errors'
import { hasNoBody } from '@/utils/has-no-body'
import { typeChecker } from '@/utils/type-checker'

export type UrlencodedBodyParsingOptions<
  Req extends Request & HasBody<ParsedUrlQuery> = Request & HasBody<ParsedUrlQuery>,
  Res extends Response<Req> = Response<Req>,
> = Omit<ReadOptions, 'defaultCharset'> & {
  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match requests with Content-Type `application/x-www-form-urlencoded`, `application/foobar+x-www-form-urlencoded`, etc.
   *
   * @default typeChecker("+urlencoded")
   */
  matcher?: (req: Req, res: Res) => boolean
}

function ensureCharsetIsUtf8(_req: unknown, _res: unknown, charset: string | undefined) {
  if (charset == null) return
  if (charset === 'utf-8') return
  /**
   * [RFC 8259 'Character Encoding']{@link https://datatracker.ietf.org/doc/html/rfc8259#section-8.1}
   */
  throw new ClientCharsetError('urlencoded content must be UTF-8 encoded', {
    charset,
    statusCode: 415,
    code: 'ERR_URLENCODED_CONTENT_MUST_BE_UTF-8',
  })
}

export function urlencoded<
  Req extends Request & HasBody<ParsedUrlQuery> = Request & HasBody<ParsedUrlQuery>,
  Res extends Response<Req> = Response<Req>,
>(options?: UrlencodedBodyParsingOptions<Req, Res>) {
  const optionsCopy: ReadOptions = Object.assign({ defaultCharset: 'utf-8' }, options)
  optionsCopy.limit ??= '100kb'
  optionsCopy.inflate ??= true
  optionsCopy.preVerify = compose(options?.preVerify, ensureCharsetIsUtf8)

  const matcher = options?.matcher ?? typeChecker(ContentType.parse('application/*+x-www-form-urlencoded'))

  const read = getRead<ParsedUrlQuery>((x) => parse(x), optionsCopy)
  return async (req: Req & MaybeParsed, res: Res, next: NextFunction) => {
    if (req[alreadyParsed] === true) return next()
    if (hasNoBody(req.method)) return next()
    if (!matcher(req, res)) return next()
    req.body = await read(req, res)
    next()
  }
}

export type { ParsedUrlQuery }
