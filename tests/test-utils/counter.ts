import { Readable } from 'node:stream'

export class Counter extends Readable {
  _max: number
  _index: number
  _errorAtIndex: number | undefined

  constructor({ errorAtIndex }: { errorAtIndex?: number } = {}) {
    super()
    this._max = 10
    this._index = 1
    this._errorAtIndex = errorAtIndex
  }

  _read() {
    const i = this._index++
    if (i === this._errorAtIndex) this.destroy(new Error())
    else if (i > this._max) this.push(null)
    else {
      const str = String(i)
      const buf = Buffer.from(str, 'ascii')
      this.push(buf)
    }
  }
}
