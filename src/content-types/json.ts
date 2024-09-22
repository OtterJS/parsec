import { ContentType } from '@otterhttp/content-type'

import { type ReadOptions, getRead } from '@/get-read'
import type { MaybeParsed, Request, Response } from '@/types'
import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { compose } from '@/utils/compose-functions'
import { ClientCharsetError } from '@/utils/errors'
import { hasNoBody } from '@/utils/has-no-body'
import { typeChecker } from '@/utils/type-checker'

export type JsonBodyParsingOptions<Req extends Request = Request, Res extends Response<Req> = Response<Req>> = Omit<
  ReadOptions,
  'defaultCharset'
> & {
  /**
   * JSON reviver to pass into JSON.parse.
   *
   * @default undefined
   */
  reviver?: (this: any, key: string, value: any) => any

  /**
   * Set to `true` to only accept JSON objects and arrays. Set to `false` to accept any value that JSON.parse will
   * accept.
   *
   * @default true
   */
  strict?: boolean

  /**
   * Matcher used to determine which requests the middleware should body-parse.
   *
   * The default matcher will match requests with Content-Type `application/json`, `application/manifest+json`, etc.
   *
   * @default typeChecker("application/*+json")
   */
  matcher?: (req: Req, res: Res) => boolean
}

/**
 * RegExp to match the first non-space in a JSON string.
 *
 * Allowed whitespace is defined in RFC 8259:
 * ws = *( %x20 / %x09 / %x0A / %x0D )
 */
const firstCharRegexp = /^[\x20\x09\x0a\x0d]*([^\x20\x09\x0a\x0d])/

function firstChar(body: string) {
  const match = firstCharRegexp.exec(body)

  return match != null ? match[1] : undefined
}

function ensureCharsetIsUtf8(_req: unknown, _res: unknown, charset: string | undefined) {
  if (charset == null) return
  if (charset === 'utf-8') return
  /**
   * [RFC 8259 'Character Encoding']{@link https://datatracker.ietf.org/doc/html/rfc8259#section-8.1}
   */
  throw new ClientCharsetError('JSON content must be UTF-8 encoded', {
    charset,
    statusCode: 415,
    code: 'ERR_JSON_CONTENT_MUST_BE_UTF-8',
  })
}

type ParsedJson = never | string | number | boolean | null | { [property: string]: ParsedJson } | ParsedJson[]

export function makeJson<Req extends Request = Request, Res extends Response<Req> = Response<Req>>(
  options?: JsonBodyParsingOptions<Req, Res>,
) {
  const optionsCopy: ReadOptions = Object.assign({ defaultCharset: 'utf-8' }, options)
  optionsCopy.limit ??= '100kb'
  optionsCopy.inflate ??= true
  optionsCopy.preVerify = compose(options?.preVerify, ensureCharsetIsUtf8)

  const reviver = options?.reviver ?? undefined
  const strict = options?.strict ?? true
  const matcher = options?.matcher ?? typeChecker(ContentType.parse('application/*+json'))

  function parse(body: string): ParsedJson {
    if (body.length === 0) return {}

    if (strict) {
      const first = firstChar(body)
      if (first !== '{' && first !== '[') {
        throw new SyntaxError('JSON body-parsing strict violation')
      }
    }

    return JSON.parse(body, reviver)
  }

  const read = getRead(parse, optionsCopy)
  return async (req: Req & MaybeParsed, res: Res): Promise<ParsedJson | undefined> => {
    if (req[alreadyParsed] === true) return undefined
    if (hasNoBody(req.method)) return undefined
    if (!matcher(req, res)) return undefined
    return await read(req, res)
  }
}
