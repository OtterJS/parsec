import { ContentType } from '@otterhttp/content-type'
import { ClientError, HttpError } from '@otterhttp/errors'

import { type RawReadOptions, type ReadOptions, getRawRead } from '@/get-read'
import { type ParsedMultipartFormData, parseMultipartFormData } from '@/parsers/multipart-form-data'
import type { MaybeParsed, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { hasNoBody } from '@/utils/has-no-body'
import { typeChecker } from '@/utils/type-checker'

export type MultipartFormDataBodyParsingOptions<
  Req extends Request = Request,
  Res extends Response<Req> = Response<Req>,
> = RawReadOptions & {
  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match requests with Content-Type `multipart/form-data`, `multipart/foobar+form-data`, etc.
   *
   * @default typeChecker("multipart/*+form-data")
   */
  matcher?: (req: Req, res: Res) => boolean
}

export function makeMultipartFormData<Req extends Request = Request, Res extends Response<Req> = Response<Req>>(
  options?: MultipartFormDataBodyParsingOptions<Req, Res>,
) {
  const optionsCopy: ReadOptions = Object.assign({}, options)
  optionsCopy.limit ??= '10mb'
  optionsCopy.inflate ??= true

  const matcher = options?.matcher ?? typeChecker(ContentType.parse('multipart/*+form-data'))

  function failBoundaryParameter(): never {
    throw new ClientError("multipart body cannot be parsed without 'boundary' parameter", {
      statusCode: 400,
      code: 'ERR_MULTIPART_BOUNDARY_REQUIRED',
    })
  }

  const rawRead = getRawRead(options)
  return async (req: Req & MaybeParsed, res: Res): Promise<ParsedMultipartFormData | undefined> => {
    if (req[alreadyParsed] === true) return undefined
    if (hasNoBody(req.method)) return undefined
    if (!matcher(req, res)) return undefined

    if (req.headers['content-type'] == null) failBoundaryParameter()
    const contentType = ContentType.parse(req.headers['content-type'])
    if (!Object.hasOwn(contentType.parameters, 'boundary')) failBoundaryParameter()
    const boundary = contentType.parameters.boundary

    const rawBody = await rawRead(req, res)

    try {
      return parseMultipartFormData(rawBody, boundary)
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new ClientError('Multipart body parsing failed', {
        statusCode: 400,
        code: 'ERR_MULTIPART_PARSE_FAILED',
        cause: err instanceof Error ? err : undefined,
      })
    }
  }
}

export type { ParsedMultipartFormData }
