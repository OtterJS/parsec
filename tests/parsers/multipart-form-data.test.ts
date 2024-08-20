import { expect, it } from 'vitest'

import { parseMultipartFormData } from '@/parsers/multipart-form-data'

it('should parse valid multipart form data with a single part', () => {
  const multipart = [
    'preamble',
    '--boundary',
    'content-disposition: form-data; name=foo',
    'content-type: application/json',
    '',
    '{ "foo": "bar" }',
    '--boundary--',
    '',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipartFormData(Buffer.from(multipart), 'boundary')).toMatchObject({
    foo: {
      fieldName: 'foo',
      type: 'field-value',
      value: {
        headers: {},
        content: Buffer.from('{ "foo": "bar" }'),
      },
    },
  })
})

it('should parse valid multipart form data with multiple parts', () => {
  const multipart = [
    'preamble',
    '--boundary',
    'content-disposition: form-data; name=foo',
    'x-content-type: application/json',
    '',
    '{ "foo": "bar" }',
    '--boundary',
    'content-length: 6',
    'content-disposition: form-data; name=bar; filename=baz',
    '',
    'foo bar baz',
    '',
    '--boundary--',
    '',
    'epilogue',
  ].join('\r\n')

  expect(parseMultipartFormData(Buffer.from(multipart), 'boundary')).toMatchObject({
    foo: {
      fieldName: 'foo',
      type: 'field-value',
      value: {
        headers: {},
        content: Buffer.from('{ "foo": "bar" }'),
      },
    },
    bar: {
      fieldName: 'bar',
      type: 'field-file-list',
      files: [
        {
          filename: 'baz',
          content: Buffer.from('foo bar baz\r\n'),
          headers: {},
        },
      ],
    },
  })
})
