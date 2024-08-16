import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'

import { type HasBody, type Request, type Response, urlencoded } from '@/index'

const urlencodedInstance = urlencoded()
const loggingUrlencoded = async (req: Request & HasBody<Record<string, string>>, res: Response) => {
  try {
    await urlencodedInstance(req, res, () => undefined)
  } catch (err) {
    console.log(err)
  }
}

test('should parse urlencoded body', async () => {
  const server = createServer(async (req: Request & HasBody<Record<string, string>>, res) => {
    await loggingUrlencoded(req, res)

    res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

    res.end(JSON.stringify(req.body))
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
  const server = createServer(async (req: Request & HasBody<Record<string, string>>, res) => {
    await loggingUrlencoded(req, res)

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
  }).expect(200, 'GET is ignored')
})
