import { expect, it } from 'vitest'

import { splitMultipart } from '@/utils/split-multipart'

it('should split correctly with string delimiter', () => {
  const toSplit = Buffer.from('abc\r\n--foo\r\nbar\r\n--foo\r\nbaz\r\n--foo\r\nquux\r\n--foo--\r\n\n')
  expect(splitMultipart(toSplit, 'foo', 'utf-8')).toEqual([
    Buffer.from('abc'),
    Buffer.from('bar'),
    Buffer.from('baz'),
    Buffer.from('quux'),
    Buffer.from('\n'),
  ])
})

it('should split correctly with buffer delimiter', () => {
  const toSplit = Buffer.from('abc\r\n--foo\r\nbar\r\n--foo\r\nbaz\r\n--foo\r\nquux\r\n--foo--\r\n\n')
  expect(splitMultipart(toSplit, Buffer.from('foo'))).toEqual([
    Buffer.from('abc'),
    Buffer.from('bar'),
    Buffer.from('baz'),
    Buffer.from('quux'),
    Buffer.from('\n'),
  ])
})
