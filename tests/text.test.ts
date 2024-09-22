import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type Request, makeText } from '@/index'

const text = makeText()

test('should parse text body', async () => {
  const server = createServer(async (req: Request, res) => {
    const body = await text(req, res)

    res.setHeader('Content-Type', 'text/plain')

    res.end(body)
  })

  await makeFetch(server)('/', {
    body: 'hello world',
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  }).expect(200, 'hello world')
})

test('text should ignore GET request', async () => {
  const server = createServer(async (req: Request, res) => {
    await text(req, res)

    res.setHeader('Content-Type', 'text/plain')

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  }).expect(200, 'GET is ignored')
})
