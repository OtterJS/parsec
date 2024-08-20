import { Buffer } from 'node:buffer'

/**
 * Split a buffer's contents by some delimiter.
 *
 * Returns an array of new {@link Buffer} objects that reference the same memory as the original,
 * but offset and cropped appropriately.
 *
 * @param toSplit
 * @param delimiter
 */
export function splitBuffer(toSplit: Buffer, delimiter: Buffer): Buffer[]
export function splitBuffer(toSplit: Buffer, delimiter: string, encoding: BufferEncoding): Buffer[]
export function splitBuffer(toSplit: Buffer, delimiter: string | Buffer, encoding?: BufferEncoding): Buffer[] {
  const parts: Buffer[] = []
  if (!(delimiter instanceof Buffer)) {
    delimiter = Buffer.from(delimiter, encoding)
  }

  let currentIndex = 0
  let lastPartBeginIndex = 0
  while (true) {
    currentIndex = toSplit.indexOf(delimiter, currentIndex)
    if (currentIndex < 0) break
    parts.push(toSplit.subarray(lastPartBeginIndex, currentIndex))
    currentIndex += delimiter.byteLength
    lastPartBeginIndex = currentIndex
  }

  parts.push(toSplit.subarray(lastPartBeginIndex))
  return parts
}
