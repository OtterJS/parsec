import { parse as parseContentType } from '@otterhttp/content-type'

import type { Request } from '@/types'

type ContentType = ReturnType<typeof parseContentType>

export const getCharset = (request: Request) => {
  let contentType: ContentType
  try {
    contentType = parseContentType(request)
  } catch {
    return undefined
  }

  const charset = contentType.parameters?.charset
  if (typeof charset === 'string') return charset.toLowerCase()
  return undefined
}
