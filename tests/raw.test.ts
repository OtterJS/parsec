import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type HasBody, type Request, type Response, raw } from '@/index'

const rawInstance = raw()
const loggingRaw = async (req: Request & HasBody<Buffer>, res: Response) => {
  try {
    await rawInstance(req, res, () => undefined)
  } catch (err) {
    console.log(err)
  }
}

test('should parse raw body', async () => {
  const server = createServer(async (req: Request & HasBody<Buffer>, res) => {
    await loggingRaw(req, res)

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
  }).expect(200, 'hello world')
})

test('raw should ignore GET request', async () => {
  const server = createServer(async (req: Request & HasBody<Buffer>, res) => {
    await loggingRaw(req, res)

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
