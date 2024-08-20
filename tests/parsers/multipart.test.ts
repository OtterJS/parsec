import { expect, it } from 'vitest'

import { parseMultipart } from '@/parsers/multipart'

it('should parse valid multipart with a single part', () => {
  const multipart = [
    'preamble',
    '--boundary  ',
    'x-content-type: application/json',
    '',
    '{ "foo": "bar" }',
    '--boundary--',
    '',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipart(Buffer.from(multipart), 'boundary')).toEqual([
    {
      headers: {
        'x-content-type': 'application/json',
      },
      content: Buffer.from('{ "foo": "bar" }'),
    },
  ])
})

it('should parse valid multipart with multiple parts', () => {
  const multipart = [
    'preamble',
    '--boundary',
    'x-content-type: application/json',
    '',
    '{ "foo": "bar" }',
    '--boundary\t  ',
    'content-length: 6',
    'x-content-disposition: attachment',
    '',
    'foobar',
    '--boundary--',
    '',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipart(Buffer.from(multipart), 'boundary')).toEqual([
    {
      headers: {
        'x-content-type': 'application/json',
      },
      content: Buffer.from('{ "foo": "bar" }'),
    },
    {
      headers: {
        'content-length': '6',
        'x-content-disposition': 'attachment',
      },
      content: Buffer.from('foobar'),
    },
  ])
})

it('should parse valid multipart form data with blank part', () => {
  const multipart = [
    'preamble',
    '--boundary',
    '',
    '',
    '--boundary--',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipart(Buffer.from(multipart), 'boundary')).toEqual([
    {
      headers: {},
      content: Buffer.from(""),
    }
  ])
})

it('should parse valid multipart form data with no preamble', () => {
  const multipart = [
    '--boundary',
    '',
    '',
    '--boundary--',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipart(Buffer.from(multipart), 'boundary')).toEqual([
    {
      headers: {},
      content: Buffer.from(""),
    }
  ])
})

it('should parse valid multipart form data with no epilogue', () => {
  const multipart = [
    'preamble',
    '--boundary',
    '',
    '',
    '--boundary--',
  ].join('\r\n')

  expect(parseMultipart(Buffer.from(multipart), 'boundary')).toEqual([
    {
      headers: {},
      content: Buffer.from(""),
    }
  ])
})

it('should reject multipart form data with missing CRLF to separate headerlines from content', () => {
  const multipart = [
    'preamble',
    '--boundary',
    '',
    '--boundary--',
    'epilogue',
  ].join('\r\n')

  expect(() => {
    parseMultipart(Buffer.from(multipart), 'boundary')
  }).toThrow()
})

it('should reject multipart form data with invalid part header-lines', () => {
  const multipart = [
    'preamble',
    '--boundary',
    '--boundary',
    '',
    'foobar',
    '--boundary--',
    'epilogue',
  ].join('\r\n')

  expect(() => {
    parseMultipart(Buffer.from(multipart), 'boundary')
  }).toThrow()
})

it('should reject multipart form data with no parts', () => {
  const multipart = [
    'preamble',
    '--boundary--',
    'epilogue'
  ].join('\r\n')

  expect(() => {
    parseMultipart(Buffer.from(multipart), 'boundary')
  }).toThrow()
})

it('should reject multipart form data with no close delimiter', () => {
  const multipart = [
    'preamble',
    '--boundary',
    '',
    '',
    '--boundary',
    'epilogue',
  ].join('\r\n')

  expect(() => {
    parseMultipart(Buffer.from(multipart), 'boundary')
  }).toThrow()
})

it('should reject multipart form data with non-linear-whitespace characters on a boundary line', () => {
  const multipart = [
    'preamble',
    '--boundary  eeee',
    '',
    '',
    '--boundary--',
    'epilogue',
  ].join('\r\n')

  expect(() => {
    parseMultipart(Buffer.from(multipart), 'boundary')
  }).toThrow()
})