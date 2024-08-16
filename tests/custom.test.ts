import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type HasBody, type Request, type Response, custom } from '@/index'

const customInstance = custom((d) => d.toUpperCase())
const loggingCustom = async (req: Request & HasBody<string>, res: Response) => {
  try {
    await customInstance(req, res, () => undefined)
  } catch (err) {
    console.log(err)
  }
}

test('should parse custom body', async () => {
  const server = createServer(async (req: Request & HasBody<string>, res) => {
    await loggingCustom(req, res)

    res.setHeader('Content-Type', 'text/plain')

    res.end(req.body)
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

test('custom should ignore GET request', async () => {
  const server = createServer(async (req: Request & HasBody<string>, res) => {
    await loggingCustom(req, res)

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
