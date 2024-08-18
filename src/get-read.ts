import { PassThrough, type Transform } from 'node:stream'
import { finished } from 'node:stream/promises'
import * as zlib from 'node:zlib'
import { ClientError, ServerError } from '@otterhttp/errors'
import { parse as parseBytes } from 'bytes'
import { encodingExists as charsetExists, decode as iconvDecode } from 'iconv-lite'

import { alreadyParsed } from '@/utils/already-parsed-symbol'
import { ClientCharsetError, ClientEncodingError, ParseFailedError, VerifyFailedError } from '@/utils/errors'
import { getCharset } from '@/utils/get-request-charset'
import { getContentLength } from '@/utils/get-request-content-length'
import { isFinished } from '@/utils/is-finished'
import { LengthValidator } from '@/utils/length-validator'
import { Limiter } from '@/utils/limiter'
import { RawSink } from '@/utils/raw-sink'
import { requestPipeline } from '@/utils/request-pipeline'
import type { HasBody, MaybeParsed, Request, Response } from './types'

const supportedEncodings = new Map<string, () => Transform>([
  ['deflate', () => zlib.createInflate()],
  ['gzip', () => zlib.createGunzip()],
  ['br', () => zlib.createBrotliDecompress()],
  ['identity', () => new PassThrough()],
])

const limiterSupplier = (limit: number | undefined): Transform => {
  if (limit == null) return new PassThrough()
  return new Limiter({ limit })
}

type ContentStreamOptions = {
  inflate?: boolean
  limit?: number | string
}

const getRawContent = (options?: ContentStreamOptions) => {
  const encodingUnsupported = (encoding: string) => {
    return new ClientEncodingError('content encoding unsupported', {
      statusCode: 415,
      encoding: encoding,
      code: 'ERR_CONTENT_ENCODING_UNSUPPORTED',
    })
  }

  const limit: number | undefined = options?.limit != null ? parseBytes(options.limit) : undefined

  return async (req: Request): Promise<Buffer> => {
    const encoding = (req.headers['content-encoding'] || 'identity').toLowerCase()

    if (options?.inflate === false && encoding !== 'identity') throw encodingUnsupported(encoding)

    const encodingTransformSupplier = supportedEncodings.get(encoding)
    if (encodingTransformSupplier == null) throw encodingUnsupported(encoding)

    const sink = new RawSink()
    await requestPipeline(req, [
      new LengthValidator({ expectedLength: getContentLength(req) }),
      encodingTransformSupplier(),
      limiterSupplier(limit),
      sink,
    ])

    return sink.content
  }
}

type RawPreVerifyFunction<
  Req extends Request & HasBody = Request & HasBody,
  Res extends Response<Req> = Response<Req>,
> = (req: Req, res: Res) => void | Promise<void>
type RawVerifyFunction<Req extends Request & HasBody = Request & HasBody, Res extends Response<Req> = Response<Req>> = (
  req: Req,
  res: Res,
  buf: Buffer,
) => void | Promise<void>

export type RawReadOptions = ContentStreamOptions & {
  preVerify?: RawPreVerifyFunction
  verify?: RawVerifyFunction
  limit?: string | number
}

const voidConsumeRequestStream = async (req: Request): Promise<void> => {
  if (isFinished(req)) return
  req.resume()
  try {
    await finished(req)
  } catch {}
}

export const getRawRead = <T = unknown>(options?: RawReadOptions) => {
  const rawContent = getRawContent(options)

  return async (req: Request & HasBody<T> & MaybeParsed, res: Response): Promise<Buffer> => {
    req[alreadyParsed] = true

    if (options?.preVerify != null) {
      try {
        options?.preVerify?.(req, res)
      } catch (err) {
        throw new ClientError('Body pre-verification failed', {
          statusCode: 403,
          code: 'ERR_ENTITY_PRE_VERIFY_FAILED',
          cause: err instanceof Error ? err : undefined,
        })
      }
    }

    let bodyBlob: Buffer
    try {
      bodyBlob = await rawContent(req)
    } catch (err) {
      await voidConsumeRequestStream(req)
      if (err instanceof Error)
        throw new ClientError('Failed to read raw body', {
          statusCode: 400,
          code: 'ERR_RAW_BODY_READ_FAILED',
          cause: err,
        })
      throw new ServerError()
    }

    if (options?.verify != null) {
      try {
        options?.verify?.(req, res, bodyBlob)
      } catch (err) {
        throw new VerifyFailedError('Body verification failed', {
          statusCode: 403,
          body: bodyBlob,
          code: 'ERR_ENTITY_VERIFY_FAILED',
          cause: err instanceof Error ? err : undefined,
        })
      }
    }

    return bodyBlob
  }
}

type PreVerifyFunction<Req extends Request & HasBody = Request & HasBody, Res extends Response<Req> = Response<Req>> = (
  req: Req,
  res: Res,
  charset: string | undefined,
) => void | Promise<void>
type VerifyFunction<Req extends Request & HasBody = Request & HasBody, Res extends Response<Req> = Response<Req>> = (
  req: Req,
  res: Res,
  blob: Buffer,
  charset: string | undefined,
) => void | Promise<void>

export type ReadOptions = Omit<RawReadOptions, 'verify' | 'preVerify'> & {
  preVerify?: PreVerifyFunction
  verify?: VerifyFunction
  defaultCharset?: string
}

export const getRead = <T = unknown>(parseFunction: (body: string) => T, options?: ReadOptions) => {
  const { defaultCharset = 'utf-8', preVerify, verify, ...restOptions } = options ?? {}

  if (!charsetExists(defaultCharset))
    throw new Error('`defaultCharset` option must be a valid character encoding supported by `iconv-lite`')

  const rawRead = getRawRead(restOptions)

  return async (req: Request & HasBody<T>, res: Response): Promise<T> => {
    let requestCharset = getCharset(req)

    if (requestCharset != null && !charsetExists(requestCharset)) {
      throw new ClientCharsetError(`unsupported charset "${requestCharset.toUpperCase()}"`, {
        statusCode: 415,
        charset: requestCharset,
        code: 'ERR_CHARSET_UNSUPPORTED',
      })
    }

    if (options?.preVerify != null) {
      try {
        options?.preVerify?.(req, res, requestCharset)
      } catch (err) {
        throw new ClientError('Body pre-verification failed', {
          statusCode: 403,
          code: 'ERR_ENTITY_PRE_VERIFY_FAILED',
          cause: err instanceof Error ? err : undefined,
        })
      }
    }

    const bodyBlob = await rawRead(req, res)

    if (verify != null) {
      try {
        verify(req, res, bodyBlob, requestCharset)
      } catch (err) {
        throw new VerifyFailedError('Body verification failed', {
          statusCode: 403,
          body: bodyBlob,
          code: 'ERR_ENTITY_VERIFY_FAILED',
          cause: err instanceof Error ? err : undefined,
        })
      }
    }

    requestCharset ??= defaultCharset

    let body: string
    try {
      body = iconvDecode(bodyBlob, requestCharset)
    } catch (err) {
      throw new ClientError(`request body does not adhere to charset '${requestCharset}'`, {
        statusCode: 400,
        code: 'ERR_CONTENT_CHARSET_MISMATCH',
        cause: err instanceof Error ? err : undefined,
      })
    }

    try {
      return parseFunction(body)
    } catch (err) {
      throw new ParseFailedError('Body parsing failed', {
        statusCode: 400,
        body,
        code: 'ERR_ENTITY_PARSE_FAILED',
        cause: err instanceof Error ? err : undefined,
      })
    }
  }
}
