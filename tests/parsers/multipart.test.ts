import { expect, it } from 'vitest'

import { parseMultipart } from '@/parsers/multipart'

it('should parse valid multipart with a single part', () => {
  const multipart = [
    'preamble',
    '--boundary',
    'x-content-type: application/json',
    '',
    '{ "foo": "bar" }',
    '--boundary',
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
    '--boundary',
    'content-length: 6',
    'x-content-disposition: attachment',
    '',
    'foobar',
    '--boundary',
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
