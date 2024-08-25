import * as _iconv from 'iconv-lite'

// @ts-expect-error
const iconv = _iconv.default as typeof _iconv 

export const charsetExists = iconv.encodingExists
export const decodeCharset = iconv.decode
