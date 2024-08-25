import * as iconv from "iconv-lite"

export const charsetExists = iconv.encodingExists
export const decodeCharset = iconv.decode