import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type Request, makeCustom } from '@/index'

const custom = makeCustom((d) => d.toUpperCase())

test('should parse custom body', async () => {
  const server = createServer(async (req: Request, res) => {
    const body = await custom(req, res)

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
  }).expect(200, 'HELLO WORLD')
})

test.skip('custom should ignore GET request', async () => {

})
