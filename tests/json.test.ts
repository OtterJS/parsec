import * as http from 'node:http'
import { HttpError } from '@otterhttp/errors'
import { expect, it } from 'vitest'

import { type HasBody, type Request, type Response, json } from '@/index'

type FetchInit = Parameters<typeof fetch>[1]

const jsonInstance = json()

function createServer() {
  return http.createServer(async (req: Request & HasBody, res: Response) => {
    function next() {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(req.body))
    }

    try {
      await jsonInstance(req, res, next)
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

function createFetch() {
  const server = createServer()
  server.listen()

  const address = server.address()
  if (address == null) throw new Error('Server is not listening')
  if (typeof address === 'string') throw new Error('Listening on unix socket is unsupported')

  return async (init: FetchInit) => await fetch(`http://localhost:${address.port}`, init)
}

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

it('should 400 when content-length mismatches actual body length', async () => {})

it('should not parse json body with no content-type headers', async () => {
  const fetch = createFetch()

  const response = await fetch({
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
  })
  expect(response.status).toBe(200)
  await expect(response.text()).resolves.toEqual('')
})

it('should ignore GET method', async () => {
  const fetch = createFetch()
  const response = await fetch({
    method: 'GET',
  })
  expect(response.status).toBe(200)
  await expect(response.text()).resolves.toEqual('')
})
