import { Buffer } from 'node:buffer'
import { ClientError } from "@otterhttp/errors";

const doubleHyphen = Buffer.from("--")
const CRLF = Buffer.from("\r\n")
const linearWhitespace = Buffer.from(" \t")

function isWhitespaceCharCode(charCode: number | undefined): boolean {
  return charCode === linearWhitespace.at(0) || charCode === linearWhitespace.at(1)
}

/**
 * Split a buffer's contents by some delimiter.
 *
 * Returns an array of new {@link Buffer} objects that reference the same memory as the original,
 * but offset and cropped appropriately.
 */
export function splitMultipart(toSplit: Buffer, boundary: Buffer): Buffer[]
export function splitMultipart(toSplit: Buffer, boundary: string, encoding?: BufferEncoding): Buffer[]
export function splitMultipart(toSplit: Buffer, boundary: string | Buffer, encoding?: BufferEncoding): Buffer[] {
  const parts: Buffer[] = []
  if (!(boundary instanceof Buffer)) {
    boundary = Buffer.from(`\r\n--${boundary}`, encoding)
  }

  let currentIndex = 0
  let previousPartBeginIndex = 0
  let seenFinalPartBoundary = false
  while (true) {
    currentIndex = toSplit.indexOf(boundary, currentIndex)
    if (currentIndex < 0) break
    if (seenFinalPartBoundary) throw new ClientError("Invalid multipart data", {
      statusCode: 400,
      code: "ERR_INVALID_MULTIPART_DATA",
    })
    parts.push(toSplit.subarray(previousPartBeginIndex, currentIndex))
    currentIndex += boundary.byteLength

    if (toSplit.subarray(currentIndex, currentIndex + doubleHyphen.byteLength).equals(doubleHyphen)) {
      currentIndex += doubleHyphen.byteLength
      seenFinalPartBoundary = true
    }

    while (isWhitespaceCharCode(toSplit.at(currentIndex))) currentIndex++

    if (!toSplit.subarray(currentIndex, currentIndex + CRLF.byteLength).equals(CRLF)) {
      throw new ClientError("Invalid multipart data", {
        statusCode: 400,
        code: "ERR_INVALID_MULTIPART_DATA",
      })
    }
    currentIndex += CRLF.byteLength
    previousPartBeginIndex = currentIndex
  }

  parts.push(toSplit.subarray(previousPartBeginIndex))
  return parts
}
