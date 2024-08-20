import { Buffer } from 'node:buffer'
import { ClientError } from '@otterhttp/errors'

const doubleHyphen = Buffer.from('--')
const CRLF = Buffer.from('\r\n')
const linearWhitespace = Buffer.from(' \t')

function isWhitespaceCharCode(charCode: number | undefined): boolean {
  return charCode === linearWhitespace.at(0) || charCode === linearWhitespace.at(1)
}

function fail(): never {
  throw new ClientError('Invalid multipart data', {
    statusCode: 400,
    code: 'ERR_INVALID_MULTIPART_DATA',
  })
}

/**
 * Split a buffer containing multipart/* contents by the specified boundary according to
 * [RFC 2026 Multipart Media Type]{@link https://datatracker.ietf.org/doc/html/rfc2046#section-5.1}.
 *
 * Returns an array of new {@link Buffer} objects that reference the same memory as the original,
 * but offset and cropped appropriately.
 */
export function splitMultipart(toSplit: Buffer, boundary: Buffer): Buffer[]
export function splitMultipart(toSplit: Buffer, boundary: string, encoding?: BufferEncoding): Buffer[]
export function splitMultipart(toSplit: Buffer, boundary: string | Buffer, encoding?: BufferEncoding): Buffer[] {
  const parts: Buffer[] = []

  const boundaryWithoutNewline = Buffer.from(`--${boundary}`, encoding)
  boundary = Buffer.from(`\r\n--${boundary}`, encoding)

  let currentIndex = 0
  let previousPartBeginIndex = 0
  let seenFinalPartBoundary = false

  if (toSplit.subarray(0, boundaryWithoutNewline.byteLength).equals(boundaryWithoutNewline)) {
    currentIndex += boundaryWithoutNewline.byteLength
    while (isWhitespaceCharCode(toSplit.at(currentIndex))) currentIndex++
    if (!toSplit.subarray(currentIndex, currentIndex + CRLF.byteLength).equals(CRLF)) fail()
    currentIndex += CRLF.byteLength
    previousPartBeginIndex = currentIndex
    parts.push(toSplit.subarray(0, 0))
  }

  while (true) {
    currentIndex = toSplit.indexOf(boundary, currentIndex)
    if (currentIndex < 0) break
    if (seenFinalPartBoundary) fail()
    parts.push(toSplit.subarray(previousPartBeginIndex, currentIndex))
    currentIndex += boundary.byteLength

    if (toSplit.subarray(currentIndex, currentIndex + doubleHyphen.byteLength).equals(doubleHyphen)) {
      currentIndex += doubleHyphen.byteLength
      seenFinalPartBoundary = true
    }

    while (isWhitespaceCharCode(toSplit.at(currentIndex))) currentIndex++

    if (!toSplit.subarray(currentIndex, currentIndex + CRLF.byteLength).equals(CRLF)) {
      if (seenFinalPartBoundary && toSplit.at(currentIndex) == null) break
      fail()
    }
    currentIndex += CRLF.byteLength
    previousPartBeginIndex = currentIndex
  }

  if (!seenFinalPartBoundary) fail()
  parts.push(toSplit.subarray(previousPartBeginIndex))
  if (parts.length < 3) fail()
  return parts
}
