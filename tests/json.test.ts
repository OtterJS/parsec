import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type HasBody, type Request, type Response, json } from '@/index'

const jsonInstance = json()
const loggingJson = async (req: Request & HasBody, res: Response) => {
  try {
    await jsonInstance(req, res, () => undefined)
  } catch (err) {
    console.log(err)
  }
}

test('should parse JSON body', async () => {
  const server = createServer(async (req: Request & HasBody, res) => {
    await loggingJson(req, res)

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(req.body))
  })

  await makeFetch(server)('/', {
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).expect(200, { hello: 'world' })
})

test('should ignore JSON empty body', async () => {
  const server = createServer(async (req: Request & HasBody, res) => {
    await loggingJson(req, res)

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify({ ok: true }))
  })

  // Empty string body
  await makeFetch(server)('/', {
    body: '',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).expect(200, { ok: true })

  // Unset body
  await makeFetch(server)('/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).expect(200, { ok: true })
})

test('should not parse json body with no content-type headers', async () => {
  const server = createServer(async (req: Request & HasBody, res) => {
    await loggingJson(req, res)

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(req.body))
  })

  await makeFetch(server)('/', {
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  }).expect(200, '')
})

test('json should call next() without a body', async () => {
  const server = createServer(async (req: Request & HasBody, res) => {
    await loggingJson(req, res)

    res.setHeader('Content-Type', 'application/json')

    res.end()
  })

  await makeFetch(server)('/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).expect(200)
})

test('json should ignore GET request', async () => {
  const server = createServer(async (req: Request & HasBody, res) => {
    await loggingJson(req, res)

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
  }).expect(200, 'GET is ignored')
})
