import { ClientError } from '@otterhttp/errors'

import type { ParsedHeaders } from '@/parsers/http-headers'
import { type ParsedMultipartDataPart, parseMultipart } from '@/parsers/multipart'

export type ParsedFormFieldValue = {
  fieldName: string
  type: 'field-value'
  value: {
    headers: ParsedHeaders
    content: Buffer
  }
}

export type ParsedFormFieldFile = {
  filename: string
  headers: ParsedHeaders
  content: Buffer
}

export type ParsedFormFieldFileList = {
  fieldName: string
  type: 'field-file-list'
  files: ParsedFormFieldFile[]
}

export type ParsedMultipartFormData = Record<string, ParsedFormFieldValue | ParsedFormFieldFileList>

export function isParsedFormFieldValue(
  value: ParsedFormFieldValue | ParsedFormFieldFileList,
): value is ParsedFormFieldValue {
  return value.type === 'field-value'
}

export function isParsedFormFieldFileList(
  value: ParsedFormFieldValue | ParsedFormFieldFileList,
): value is ParsedFormFieldFileList {
  return value.type === 'field-file-list'
}

function getFilesFromMixed(mixedContent: Buffer, boundary: string): ParsedFormFieldFile[] {
  const parts = parseMultipart(mixedContent, boundary)
  const files: ParsedFormFieldFile[] = []

  for (const part of parts) {
    const contentDisposition = part.headers['content-disposition']
    if (contentDisposition != null && Object.hasOwn(contentDisposition.parameters, 'filename')) {
      files.push({
        filename: contentDisposition.parameters.filename,
        headers: part.headers,
        content: part.content,
      })
      continue
    }

    const contentType = part.headers['content-type']
    if (contentType != null && Object.hasOwn(contentType.parameters, 'name')) {
      files.push({
        filename: contentType.parameters.name,
        headers: part.headers,
        content: part.content,
      })
      continue
    }

    // ignore any parts with no clear filename specified
    void undefined
  }

  return files
}

function addFormData(part: ParsedMultipartDataPart, dest: ParsedMultipartFormData): void {
  function fail(): never {
    throw new ClientError('Invalid multipart form-data', {
      code: 'ERR_INVALID_FORM_DATA',
    })
  }

  const contentDisposition = part.headers['content-disposition']
  if (contentDisposition == null) fail()
  if (contentDisposition.type !== 'form-data') fail()
  if (!Object.hasOwn(contentDisposition.parameters, 'name')) fail()
  const name = contentDisposition.parameters.name

  if (Object.hasOwn(contentDisposition.parameters, 'filename')) {
    // get file from part
    const filename = contentDisposition.parameters.filename
    const file: ParsedFormFieldFile = {
      filename: filename,
      headers: part.headers,
      content: part.content,
    }

    if (Object.hasOwn(dest, name) && dest[name] != null) {
      const existingEntry = dest[name]
      // don't overwrite pre-existing values
      if (!isParsedFormFieldFileList(existingEntry)) return
      existingEntry.files.push(file)
      return
    }

    dest[name] = {
      fieldName: name,
      type: 'field-file-list',
      files: [file],
    } satisfies ParsedFormFieldFileList

    return
  }

  const contentType = part.headers['content-type']
  if (contentType != null && contentType.mediaType === 'multipart/mixed') {
    // get files from multipart/mixed
    if (!Object.hasOwn(contentType.parameters, 'boundary')) fail()
    const files = getFilesFromMixed(part.content, contentType.parameters.boundary)

    if (Object.hasOwn(dest, name) && dest[name] != null) {
      const existingEntry = dest[name]
      // don't overwrite pre-existing values
      if (!isParsedFormFieldFileList(existingEntry)) return
      existingEntry.files.push(...files)
      return
    }

    dest[name] = {
      fieldName: name,
      type: 'field-file-list',
      files: files,
    } satisfies ParsedFormFieldFileList

    return
  }

  // otherwise, consider the part to be a value specifier
  // don't overwrite pre-existing values
  if (Object.hasOwn(dest, name) && dest[name] != null) return

  dest[name] = {
    fieldName: name,
    type: 'field-value',
    value: {
      headers: part.headers,
      content: part.content,
    },
  } satisfies ParsedFormFieldValue
}

/**
 * @see [RFC 7578](https://datatracker.ietf.org/doc/html/rfc7578)
 */
export function parseMultipartFormData(body: Buffer, boundary: string): ParsedMultipartFormData {
  const parts = parseMultipart(body, boundary)
  const parsedFormData: ParsedMultipartFormData = {}
  for (const part of parts) {
    addFormData(part, parsedFormData)
  }
  return parsedFormData
}
