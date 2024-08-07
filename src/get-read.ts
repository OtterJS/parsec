import * as zlib from "node:zlib"
import type { Readable as ReadableStream } from "node:stream"
import createHttpError from "http-errors"
import { encodingExists as charsetExists, decode as iconvDecode } from "iconv-lite"
import getRawBody from "raw-body"

import type { ReqWithBody, Response } from "./types";
import { getCharset } from "@/utils/get-request-charset";
import { onFinished, isFinished } from "@/utils/on-finished";

const supportedEncodings = new Map<string, (req: ReqWithBody) => { stream: ReadableStream, length?: number | undefined }>([
  ["deflate", (req) => { 
    const stream = zlib.createInflate()
    req.pipe(stream)
    return { stream }
  }],
  ["gzip", (req) => {
    const stream = zlib.createGunzip()
    req.pipe(stream)
    return { stream }
  }],
  ["br", (req) => {
    const stream = zlib.createBrotliDecompress()
    req.pipe(stream)
    return { stream }
  }],
  ["identity", (req) => {
    let length: number | undefined = Number(req.headers["content-length"])
    if (isNaN(length)) throw createHttpError(400, "'content-length' header missing or malformed")
    return { stream: req, length }
  }]
])

type ContentStreamOptions = {
  inflate?: boolean
}

const getContentStream = (options?: ContentStreamOptions) => {
  const encodingUnsupported = (encoding: string) => {
    return createHttpError(415, 'content encoding unsupported', {
      encoding: encoding,
      type: 'encoding.unsupported'
    })
  }

  return (req: ReqWithBody) => { 
    const encoding = (req.headers["content-encoding"] || "identity").toLowerCase()
  
    if (options?.inflate === false && encoding !== "identity") throw encodingUnsupported(encoding)

    const encodingStreamFunction = supportedEncodings.get(encoding)
    if (encodingStreamFunction == null) throw encodingUnsupported(encoding)

    return encodingStreamFunction(req)
  }
}

type RawPreVerifyFunction<Req = ReqWithBody, Res = Response> = (req: Req, res: Res) => void | Promise<void>
type RawVerifyFunction<Req = ReqWithBody, Res = Response> = (req: Req, res: Res, buf: Buffer) => void | Promise<void>

type RawReadOptions = ContentStreamOptions & {
  preVerify?: RawPreVerifyFunction
  verify?: RawVerifyFunction
  limit?: string | number
}

const voidConsumeRequestStream = async (req: ReqWithBody): Promise<void> => {
  if (isFinished(req)) return
  req.resume()
  try { await onFinished(req) } catch {}
}

export const getRawRead = <T = unknown>(options?: RawReadOptions) => {
  const contentStream = getContentStream(options)

  return async (req: ReqWithBody<T>, res: Response): Promise<Buffer> => {
    if (options?.preVerify != null) {
      try {
        options?.preVerify?.(req, res)
      } catch (err) {
        if (createHttpError.isHttpError(err)) throw createHttpError(403, err, { type: err.type ?? "entity.pre-verify.failed" })
        if (err instanceof Error) throw createHttpError(403, err, { type: "entity.pre-verify.failed" })
        throw createHttpError(403, { type: "entity.pre-verify.failed" })
      }
    }

    const { stream, length } = contentStream(req)

    let bodyBlob: Buffer
    try {
      bodyBlob = await getRawBody(stream, { limit: options?.limit, length })
    } catch (err) {
      stream.destroy()

      await voidConsumeRequestStream(req)
      if (err instanceof Error) throw createHttpError(400, err)
      throw createHttpError(500)
    }
    
    if (options?.verify != null) {
      try {
        options?.verify?.(req, res, bodyBlob)
      } catch (err) {
        if (createHttpError.isHttpError(err)) throw createHttpError(403, err, { body: bodyBlob, type: err.type ?? "entity.verify.failed" })
        if (err instanceof Error) throw createHttpError(403, err, { body: bodyBlob, type: "entity.verify.failed" })
        throw createHttpError(403, { body: bodyBlob, type: "entity.verify.failed" })
      }
    }
    
    return bodyBlob
  }
}

type PreVerifyFunction<Req = ReqWithBody, Res = Response> = (req: Req, res: Res, charset: string | undefined) => void | Promise<void>
type VerifyFunction<Req = ReqWithBody, Res = Response> = (req: Req, res: Res, charset: string | undefined) => void | Promise<void>

type ReadOptions = Omit<RawReadOptions, 'verify' | 'preVerify'> & {
  preVerify?: PreVerifyFunction,
  verify?: VerifyFunction
  defaultCharset?: string
}

export const getRead = <T = unknown>(parseFunction: (body: string) => T, options?: ReadOptions) => {
  const { 
    defaultCharset = "utf-8", 
    preVerify, 
    verify, 
    ...restOptions 
  } = options ?? {}
  
  if (!charsetExists(defaultCharset)) throw new Error("`defaultCharset` option must be a valid character encoding supported by `iconv-lite`")

  const rawRead = getRawRead(restOptions)
  
  return async (req: ReqWithBody<T>, res: Response): Promise<T> => {
    let requestCharset = getCharset(req)

    if (requestCharset != null && !charsetExists(requestCharset)) {
      throw createHttpError(415, `unsupported charset "${requestCharset.toUpperCase()}"`, {
        charset: requestCharset,
        type: 'charset.unsupported'
      })
    }

    if (options?.preVerify != null) {
      try {
        options?.preVerify?.(req, res, requestCharset)
      } catch (err) {
        if (createHttpError.isHttpError(err)) throw createHttpError(403, err, { type: err.type ?? "entity.pre-verify.failed" })
        if (err instanceof Error) throw createHttpError(403, err, { type: "entity.pre-verify.failed" })
        throw createHttpError(403, { type: "entity.pre-verify.failed" })
      }
    }
    
    const bodyBlob = await rawRead(req, res)
    requestCharset ??= defaultCharset
    
    let body: string
    try {
      body = iconvDecode(bodyBlob, requestCharset)
    } catch (err) {
      if (err instanceof Error) throw createHttpError(400, `request body does not adhere to charset '${requestCharset}'`, err)
      throw createHttpError(400, `request body does not adhere to charset '${requestCharset}'`)
    }

    try {
      return parseFunction(body)
    } catch (err) {
      if (createHttpError.isHttpError(err)) throw createHttpError(400, err, { body, type: err.type ?? "entity.parse.failed" })
      if (err instanceof Error) throw createHttpError(400, err, { body, type: "entity.parse.failed" })
      throw createHttpError(400, { body, type: "entity.parse.failed" })
    }
  }
}
