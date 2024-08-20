import type { IncomingHttpHeaders } from 'node:http'
import { ClientError } from '@otterhttp/errors'

/**
 * [RFC 9110, Collected ABNF]{@link https://www.rfc-editor.org/rfc/rfc9110.html#name-collected-abnf}
 *
 * ```
 * OWS = *( SP / HTAB )
 *
 * field-content = field-vchar [ 1*( SP / HTAB / field-vchar ) field-vchar ]
 * field-name = token
 * field-value = *field-content
 * field-vchar = VCHAR / obs-text
 *
 * obs-text = %x80-FF
 *
 * token = 1*tchar
 * tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *       / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *       / DIGIT / ALPHA
 *       ; any VCHAR, except delimiters
 * ```
 *
 * [RFC 9112, Field Syntax]{@link https://www.rfc-editor.org/rfc/rfc9112#name-field-syntax}
 *
 * ```
 * field-line = field-name ":" OWS field-value OWS
 * ```
 */

/**
 * RegExp to match a single whitespace character
 */
const WHITESPACE_CHAR_REGEXP = /[\u0009\u0020]/

/**
 * RegExp to match a single token character
 */
const TOKEN_CHAR_REGEXP = /[!#$%&'*+.^_`|~0-9A-Za-z-]/

/**
 * RegExp to match a single field-vchar character
 */
const FIELD_VALUE_CHAR_REGEXP = /[\u0021-\u007e\u0080-\u00ff]/

/**
 * @see [node/lib/_http_incoming.js]{@link https://github.com/nodejs/node/blob/561bc87c7607208f0d3db6dcd9231efeb48cfe2f/lib/_http_incoming.js#L276-L371}
 */
function matchKnownFields(field: string, lowercased?: boolean) {
  switch (field.length) {
    case 3:
      if (field === 'Age' || field === 'age') return 'age'
      break
    case 4:
      if (field === 'Host' || field === 'host') return 'host'
      if (field === 'From' || field === 'from') return 'from'
      if (field === 'ETag' || field === 'etag') return 'etag'
      if (field === 'Date' || field === 'date') return '\u0000date'
      if (field === 'Vary' || field === 'vary') return '\u0000vary'
      break
    case 6:
      if (field === 'Server' || field === 'server') return 'server'
      if (field === 'Cookie' || field === 'cookie') return '\u0002cookie'
      if (field === 'Origin' || field === 'origin') return '\u0000origin'
      if (field === 'Expect' || field === 'expect') return '\u0000expect'
      if (field === 'Accept' || field === 'accept') return '\u0000accept'
      break
    case 7:
      if (field === 'Referer' || field === 'referer') return 'referer'
      if (field === 'Expires' || field === 'expires') return 'expires'
      if (field === 'Upgrade' || field === 'upgrade') return '\u0000upgrade'
      break
    case 8:
      if (field === 'Location' || field === 'location') return 'location'
      if (field === 'If-Match' || field === 'if-match') return '\u0000if-match'
      break
    case 10:
      if (field === 'User-Agent' || field === 'user-agent') return 'user-agent'
      if (field === 'Set-Cookie' || field === 'set-cookie') return '\u0001'
      if (field === 'Connection' || field === 'connection') return '\u0000connection'
      break
    case 11:
      if (field === 'Retry-After' || field === 'retry-after') return 'retry-after'
      break
    case 12:
      if (field === 'Content-Type' || field === 'content-type') return 'content-type'
      if (field === 'Max-Forwards' || field === 'max-forwards') return 'max-forwards'
      break
    case 13:
      if (field === 'Authorization' || field === 'authorization') return 'authorization'
      if (field === 'Last-Modified' || field === 'last-modified') return 'last-modified'
      if (field === 'Cache-Control' || field === 'cache-control') return '\u0000cache-control'
      if (field === 'If-None-Match' || field === 'if-none-match') return '\u0000if-none-match'
      break
    case 14:
      if (field === 'Content-Length' || field === 'content-length') return 'content-length'
      break
    case 15:
      if (field === 'Accept-Encoding' || field === 'accept-encoding') return '\u0000accept-encoding'
      if (field === 'Accept-Language' || field === 'accept-language') return '\u0000accept-language'
      if (field === 'X-Forwarded-For' || field === 'x-forwarded-for') return '\u0000x-forwarded-for'
      break
    case 16:
      if (field === 'Content-Encoding' || field === 'content-encoding') return '\u0000content-encoding'
      if (field === 'X-Forwarded-Host' || field === 'x-forwarded-host') return '\u0000x-forwarded-host'
      break
    case 17:
      if (field === 'If-Modified-Since' || field === 'if-modified-since') return 'if-modified-since'
      if (field === 'Transfer-Encoding' || field === 'transfer-encoding') return '\u0000transfer-encoding'
      if (field === 'X-Forwarded-Proto' || field === 'x-forwarded-proto') return '\u0000x-forwarded-proto'
      break
    case 19:
      if (field === 'Proxy-Authorization' || field === 'proxy-authorization') return 'proxy-authorization'
      if (field === 'If-Unmodified-Since' || field === 'if-unmodified-since') return 'if-unmodified-since'
      break
  }
  if (lowercased) {
    return `\u0000${field}`
  }
  return matchKnownFields(field.toLowerCase(), true)
}

/**
 * @see [node/lib/_http_incoming.js]{@link https://github.com/nodejs/node/blob/561bc87c7607208f0d3db6dcd9231efeb48cfe2f/lib/_http_incoming.js#L382-L414}
 */
function addHeader(field: string, value: string, dest: IncomingHttpHeaders): void {
  field = matchKnownFields(field)
  const flag = field.charCodeAt(0)
  if (flag === 0 || flag === 2) {
    field = field.slice(1)
    // Make a delimited list
    if (typeof dest[field] === 'string') {
      dest[field] += (flag === 0 ? ', ' : '; ') + value
    } else {
      dest[field] = value
    }
  } else if (flag === 1) {
    // Array header -- only Set-Cookie at the moment
    if (dest['set-cookie'] !== undefined) {
      dest['set-cookie'].push(value)
    } else {
      dest['set-cookie'] = [value]
    }
  } else if (dest[field] === undefined) {
    // Drop duplicates
    dest[field] = value
  }
}

export function parseHttpHeader(headerLine: string, dest: IncomingHttpHeaders): void {
  function fail(): never {
    throw new ClientError('Invalid header field-line', {
      code: 'ERR_INVALID_HEADER_LINE',
    })
  }

  let currentIndex = 0
  let colonIndex: number | undefined
  let valueStartIndex: number | undefined
  let valueEndIndex: number | undefined
  for (; currentIndex < headerLine.length; currentIndex++) {
    const currentChar = headerLine.charAt(currentIndex)

    // match token characters until colon
    if (colonIndex == null) {
      if (currentIndex === 0 && currentChar === ':') fail()

      if (currentChar === ':') {
        colonIndex = currentIndex
        continue
      }

      if (TOKEN_CHAR_REGEXP.test(currentChar)) continue
      fail()
    }

    // match whitespace characters until field value
    if (valueStartIndex == null) {
      if (FIELD_VALUE_CHAR_REGEXP.test(currentChar)) {
        valueStartIndex = currentIndex
        valueEndIndex = currentIndex
        continue
      }

      if (WHITESPACE_CHAR_REGEXP.test(currentChar)) continue
      fail()
    }

    // match field value characters or whitespace, keeping track of final field value character index
    if (FIELD_VALUE_CHAR_REGEXP.test(currentChar)) {
      valueEndIndex = currentIndex
      continue
    }

    if (WHITESPACE_CHAR_REGEXP.test(currentChar)) continue
    fail()
  }

  if (colonIndex == null) fail()
  if (valueStartIndex == null) fail()
  if (valueEndIndex == null) fail()

  const field = headerLine.slice(0, colonIndex)
  const value = headerLine.slice(valueStartIndex, valueEndIndex + 1)
  addHeader(field, value, dest)
}
