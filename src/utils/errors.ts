import { ClientError } from '@otterhttp/errors'

type ClientErrorOptions = ConstructorParameters<typeof ClientError>[1]

export class ClientEncodingError extends ClientError {
  encoding: string

  constructor(message: string, options: ClientErrorOptions & { encoding: string }) {
    options.statusCode ??= 415
    super(message, options)

    this.encoding = options.encoding
  }
}

export class ClientCharsetError extends ClientError {
  charset: string

  constructor(message: string, options: ClientErrorOptions & { charset: string }) {
    options.statusCode ??= 415
    super(message, options)

    this.charset = options.charset
  }
}

export class VerifyFailedError extends ClientError {
  body: Buffer

  constructor(message: string, options: ClientErrorOptions & { body: Buffer }) {
    options.statusCode ??= 403
    super(message, options)

    this.body = options.body
  }
}

export class ParseFailedError extends ClientError {
  body: string

  constructor(message: string, options: ClientErrorOptions & { body: string }) {
    options.statusCode ??= 400
    super(message, options)

    this.body = options.body
  }
}
