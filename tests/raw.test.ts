import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type Request, makeRaw } from '@/index'

const raw = makeRaw()

test('should parse raw body', async () => {
  const server = createServer(async (req: Request, res) => {
    const body = await raw(req, res)

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

test.skip('raw should ignore GET request', async () => {})
