import { ContentType } from '@otterhttp/content-type'
import { ClientError, HttpError } from '@otterhttp/errors'

import { type RawReadOptions, type ReadOptions, getRawRead } from '@/get-read'
import { type ParsedMultipartData, parseMultipart } from '@/parsers/multipart'
import type { HasBody, MaybeParsed, NextFunction, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'
import { typeChecker } from '@/utils/type-checker'

export type RawMultipartBodyParsingOptions<
  Req extends Request & HasBody<ParsedMultipartData> = Request & HasBody<ParsedMultipartData>,
  Res extends Response<Req> = Response<Req>,
> = RawReadOptions & {
  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match requests with Content-Type `multipart/mixed`, `multipart/foobar+form-data`, etc.
   *
   * @default typeChecker("multipart/*")
   */
  matcher?: (req: Req, res: Res) => boolean
}

export function rawMultipart<
  Req extends Request & HasBody<ParsedMultipartData> = Request & HasBody<ParsedMultipartData>,
  Res extends Response<Req> = Response<Req>,
>(options?: RawMultipartBodyParsingOptions<Req, Res>) {
  const optionsCopy: ReadOptions = Object.assign({}, options)
  optionsCopy.limit ??= '10mb'
  optionsCopy.inflate ??= true

  const matcher = options?.matcher ?? typeChecker(ContentType.parse('multipart/*'))

  function failBoundaryParameter(): never {
    throw new ClientError("multipart body cannot be parsed without 'boundary' parameter", {
      statusCode: 400,
      code: 'ERR_MULTIPART_BOUNDARY_REQUIRED',
    })
  }

  const rawRead = getRawRead(options)
  return async (req: Req & MaybeParsed, res: Res, next: NextFunction) => {
    if (req[alreadyParsed] === true) return next()
    if (hasNoBody(req.method)) return next()
    if (!matcher(req, res)) return next()

    if (req.headers['content-type'] == null) failBoundaryParameter()
    const contentType = ContentType.parse(req.headers['content-type'])
    if (!Object.hasOwn(contentType.parameters, 'boundary')) failBoundaryParameter()
    const boundary = contentType.parameters.boundary

    const rawBody = await rawRead(req, res)

    try {
      req.body = parseMultipart(rawBody, boundary)
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new ClientError('Multipart body parsing failed', {
        statusCode: 400,
        code: 'ERR_MULTIPART_PARSE_FAILED',
        cause: err instanceof Error ? err : undefined,
      })
    }
    next()
  }
}
