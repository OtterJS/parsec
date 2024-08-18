import stream from 'node:stream'

export class RawSink extends stream.Writable {
  private readonly contentChunks: Buffer[]

  constructor() {
    super({ decodeStrings: true })
    this.contentChunks = []
  }

  _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.contentChunks.push(chunk)
    callback()
  }

  get content() {
    return Buffer.concat(this.contentChunks)
  }
}
