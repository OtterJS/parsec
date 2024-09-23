import * as http from 'node:http'
import zlib from 'node:zlib'
import { HttpError } from '@otterhttp/errors'
import { assert, afterEach, describe, expect, it, vi } from 'vitest'

import './test-utils/mock-get-content-length'

import { type JsonBodyParsingOptions, type Request, type Response, makeJson } from '@/index'
import { getContentLength } from '@/utils/get-request-content-length'

type FetchInit = Parameters<typeof fetch>[1]

function createServer(opts?: JsonBodyParsingOptions) {
  const json = makeJson(opts)

  return http.createServer(async (req: Request, res: Response) => {
    try {
      const body = await json(req, res)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    } catch (err) {
      if (err instanceof HttpError) {
        res.statusCode = err.statusCode
        res.end(`[${err.name}] ${err.statusMessage}`)
      }
    } finally {
      res.end()
    }
  })
}

function createFetch(opts?: JsonBodyParsingOptions) {
  const server = createServer(opts)
  server.listen()

  const address = server.address()
  if (address == null) throw new Error('Server is not listening')
  if (typeof address === 'string') throw new Error('Listening on unix socket is unsupported')

  return async (init: FetchInit) => await fetch(`http://localhost:${address.port}`, init)
}

afterEach(() => {
  vi.restoreAllMocks()
})

it('should parse JSON body', async () => {
  const fetch = createFetch()
  const response = await fetch({
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ hello: 'world' })
})

it('should handle blank body', async () => {
  const fetch = createFetch()
  const response = await fetch({
    body: '',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({})
})

it('should handle missing body', async () => {
  const fetch = createFetch()
  const response = await fetch({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({})
})

it('should 400 when content-length mismatches actual body length', async () => {
  vi.mocked(getContentLength).mockReturnValue(3)

  const fetch = createFetch()
  const response = await fetch({
    method: 'POST',
    body: JSON.stringify({ foo: 'bar' }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  expect(response.status).toBe(400)
})

it('should not parse json body with no content-type headers', async () => {
  const fetch = createFetch()

  const response = await fetch({
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
  })
  expect(response.status).toBe(200)
  await expect(response.text()).resolves.toEqual('')
})

it.skip('should ignore GET requests', async () => {})

describe('with invalid JSON body', () => {
  it('should 400 when body consists only of whitespace', async () => {
    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: ' \t\t\n   ',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(response.status).toBe(400)
  })

  it('should 400 when body contains a bad token', async () => {
    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: '{:',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(response.status).toBe(400)
  })

  it('should 400 when body ends prematurely', async () => {
    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: '{:',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(response.status).toBe(400)
  })
})

describe.skip("'limit' option", () => {})

describe.skip("'inflate' option", () => {})

describe.skip("'strict' option", () => {})

describe.skip("'verify' option", () => {})

describe('relating to character sets', () => {
  it('should parse JSON content that uses utf-8 charset', async () => {
    const fetch = createFetch()
    const response = await fetch({
      body: JSON.stringify({ hello: 'world' }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ hello: 'world' })
  })

  it('should 415 when provided JSON content that does not use utf-8 charset', async () => {
    const fetch = createFetch()
    const response = await fetch({
      body: JSON.stringify({ hello: 'world' }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-16',
      },
    })
    expect(response.status).toBe(415)
  })

  it('should assume JSON content that does not specify a charset uses utf-8', async () => {
    const fetch = createFetch()
    const response = await fetch({
      body: JSON.stringify({ hello: 'world' }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ hello: 'world' })
  })
})

describe('with encoded JSON body', () => {
  it('should support gzip encoding', async () => {
    const obj = { foo: 'bar', bar: 'baz', baz: 'quux' }
    const content = JSON.stringify(obj)
    const encodedContent = zlib.gzipSync(content)
    assert(Buffer.compare(Buffer.from(content), encodedContent) !== 0)

    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: encodedContent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(obj)
  })

  it('should support deflate encoding', async () => {
    const obj = { foo: 'bar', bar: 'baz', baz: 'quux' }
    const content = JSON.stringify(obj)
    const encodedContent = zlib.deflateSync(content)
    assert(Buffer.compare(Buffer.from(content), encodedContent) !== 0)

    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: encodedContent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'deflate',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(obj)
  })

  it('should support brotli encoding', async () => {
    const obj = { foo: 'bar', bar: 'baz', baz: 'quux' }
    const content = JSON.stringify(obj)
    const encodedContent = zlib.brotliCompressSync(content)
    assert(Buffer.compare(Buffer.from(content), encodedContent) !== 0)

    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: encodedContent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'br',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(obj)
  })

  it('should 415 when encoding is unknown', async () => {
    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: Buffer.from('0000000', 'hex'),
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'foobarbaz',
      },
    })
    expect(response.status).toBe(415)
  })

  it('should 400 when encoded content is malformed', async () => {
    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: Buffer.from('1f8b080000000000000bedc1010d000000c2a0f74f6d0f071400000000000000', 'hex'),
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    })
    expect(response.status).toBe(400)
  })

  it('should validate content-length of deflated content', async () => {
    const content = JSON.stringify({ foo: 'bar', bar: 'baz', baz: 'quux' })
    vi.mocked(getContentLength).mockReturnValue(content.length)

    const encodedContent = zlib.gzipSync(content)
    assert(encodedContent.byteLength !== content.length)

    const fetch = createFetch()
    const response = await fetch({
      method: 'POST',
      body: encodedContent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    })
    expect(response.status).toBe(400)
  })

  it("should apply 'limit' option to inflated content", async () => {
    // inflated data size exceeds 1kb, but gzipped size is lesser than 1kb
    const fetch = createFetch({ limit: '1kb' })
    const response = await fetch({
      method: 'POST',
      body: Buffer.concat([
        Buffer.from('1f8b080000000000000bedc1010d000000c2a0f74f6d0f071400000000000000', 'hex'),
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
        Buffer.from('0000000000000000004f0625b3b71650c30000', 'hex'),
      ]),
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    })
    expect(response.status).toBe(413)
  })
})
