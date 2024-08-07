import { parse as parseContentType } from "@tinyhttp/content-type"

import { ReqWithBody } from "@/types";

type ContentType = ReturnType<typeof parseContentType>

export const getCharset = (request: ReqWithBody) => {
  let contentType: ContentType
  try {
    contentType = parseContentType(request)
  } catch {
    return undefined
  }
  
  const charset = contentType.parameters?.charset
  if (typeof charset === "string") return charset.toLowerCase()
  return undefined
}
