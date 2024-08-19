import stream from 'node:stream'
import { ClientError } from '@otterhttp/errors'

type LimiterOptions = {
  limit: number
}

export class Limiter extends stream.Transform {
  currentLength: number
  lengthLimit: number

  constructor({ limit }: LimiterOptions) {
    super({ decodeStrings: true })
    this.lengthLimit = limit
    this.currentLength = 0
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: stream.TransformCallback): void {
    this.currentLength += chunk.byteLength
    if (this.currentLength > this.lengthLimit) {
      return callback(
        new ClientError('Decoded content size exceeded limit', {
          statusCode: 413,
          code: 'ERR_CONTENT_LENGTH_EXCEEDED_LIMIT',
        }),
      )
    }
    callback(null, chunk)
  }
}
