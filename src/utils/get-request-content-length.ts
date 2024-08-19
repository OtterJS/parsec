import { ClientError } from '@otterhttp/errors'

import type { Request } from '@/types'

export const getContentLength = (
  request: Request,
  { allowChunkedEncoding = true }: { allowChunkedEncoding?: boolean } = {},
): number | undefined => {
  const length: number | undefined = Number(request.headers['content-length'])
  if (Number.isNaN(length)) {
    if (allowChunkedEncoding) return undefined
    throw new ClientError("'content-length' header missing or malformed", {
      statusCode: 411,
      code: 'ERR_CONTENT_LENGTH_MISSING_OR_MALFORMED',
    })
  }
  return length
}
