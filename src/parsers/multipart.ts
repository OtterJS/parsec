import { type ParsedHeaders, parseHttpHeader } from '@/parsers/http-headers'
import { splitBuffer } from '@/utils/split-buffer'
import { ClientError } from '@otterhttp/errors'

export type ParsedMultipartDataPart = {
  headers: ParsedHeaders
  content: Buffer
}

export type ParsedMultipartData = Array<ParsedMultipartDataPart>

const CRLF = Buffer.from('\r\n')

/**
 * @see [RFC 2046 Multipart Media Type](https://datatracker.ietf.org/doc/html/rfc2046#section-5.1)
 */
export function parseMultipart(body: Buffer, boundary: string): ParsedMultipartData {
  const delimiter = Buffer.from(`\r\n--${boundary}\r\n`)
  const parts = splitBuffer(body, delimiter)
  parts.shift() // ignore the preamble
  parts.pop() // ignore the epilogue
  return parts.map(parseMultipartPart)
}

function parseMultipartPart(part: Buffer): ParsedMultipartDataPart {
  const headerLines: Buffer[] = []

  let currentIndex = 0
  let nextIndex: number | undefined
  while (true) {
    nextIndex = part.indexOf(CRLF, currentIndex)

    if (nextIndex === -1) break
    if (nextIndex === currentIndex) break
    headerLines.push(part.subarray(currentIndex, nextIndex))

    currentIndex = nextIndex
    currentIndex += CRLF.byteLength
  }

  if (nextIndex === -1)
    throw new ClientError('Invalid multipart data', {
      statusCode: 400,
      code: 'ERR_INVALID_MULTIPART_DATA',
    })

  const headers: ParsedMultipartDataPart['headers'] = {}

  for (const headerLine of headerLines) {
    parseHttpHeader(headerLine.toString(), headers)
  }

  const content = part.subarray(currentIndex + CRLF.byteLength)

  return { headers, content }
}
