import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type Request, makeUrlencoded } from '@/index'

const urlencoded = makeUrlencoded()

test('should parse urlencoded body', async () => {
  const server = createServer(async (req: Request, res) => {
    const body = await urlencoded(req, res)

    res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

    res.end(JSON.stringify(body))
  })

  await makeFetch(server)('/', {
    body: 'hello=world',
    method: 'POST',
    headers: {
      Accept: 'application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).expect(200, { hello: 'world' })
})

test('urlencoded should ignore GET request', async () => {
  const server = createServer(async (req: Request, res) => {
    const body = await urlencoded(req, res)

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
  }).expect(200, 'GET is ignored')
})
