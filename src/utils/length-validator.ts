import stream from 'node:stream'
import { ClientError } from "@otterhttp/errors";

type LengthValidatorOptions = {
  expectedLength: number
}

export class LengthValidator extends stream.Transform {
  currentLength: number
  expectedLength: number

  constructor({ expectedLength }: LengthValidatorOptions) {
    super({ decodeStrings: true })
    this.expectedLength = expectedLength
    this.currentLength = 0
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: stream.TransformCallback): void {
    this.currentLength += chunk.byteLength
    if (this.currentLength > this.expectedLength) {
      return callback(new ClientError('Actual content length exceeded claimed content length', {
        statusCode: 400,
        code: "ERR_CONTENT_LENGTH_EXCEEDED_CLAIM"
      }))
    }
    callback(null, chunk)
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.currentLength !== this.expectedLength) {
      return callback(new ClientError('Actual content length mismatched claimed content length', {
        statusCode: 400,
        code: "ERR_CONTENT_LENGTH_MISMATCHED_CLAIM"
      }))
    }
    callback(null)
  }
}
