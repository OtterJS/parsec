import { createServer } from 'node:http'
import { makeFetch } from 'supertest-fetch'
import { test } from 'vitest'
import { type ReqWithBody, custom, json, raw, text, urlencoded } from '../src'

test('should parse JSON body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    try {
      await json()(req, res, () => undefined)
    } catch (err) {
      console.log(err)
    }

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(req.body))
  })

  await makeFetch(server)('/', {
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).expect(200, { hello: 'world' })
})

test('should ignore JSON empty body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await json()(req, res, () => undefined)

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify({ ok: true }))
  })

  // Empty string body
  await makeFetch(server)('/', {
    body: '',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).expect(200, { ok: true })

  // Unset body
  await makeFetch(server)('/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).expect(200, { ok: true })
})

test('should parse json body with no content-type headers', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await json()(req, res, () => undefined)

    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(req.body))
  })

  await makeFetch(server)('/', {
    body: JSON.stringify({ hello: 'world' }),
    method: 'POST',
    headers: {
      Accept: 'application/json'
    }
  }).expect(200, { hello: 'world' })
})

test('json should call next() without a body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await json()(req, res, () => undefined)

    res.setHeader('Content-Type', 'application/json')

    res.end()
  })

  await makeFetch(server)('/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).expect(200)
})

test('json should ignore GET request', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await json()(req, res, () => undefined)

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET'
  }).expect(200, 'GET is ignored')
})

test('should parse urlencoded body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await urlencoded()(req, res, () => undefined)

    res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

    res.end(JSON.stringify(req.body))
  })

  await makeFetch(server)('/', {
    body: 'hello=world',
    method: 'POST',
    headers: {
      Accept: 'application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).expect(200, { hello: 'world' })
})

test('urlencoded should ignore GET request', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await urlencoded()(req, res, () => undefined)

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET'
  }).expect(200, 'GET is ignored')
})

test('should parse text body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await text()(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end(req.body)
  })

  await makeFetch(server)('/', {
    body: 'hello world',
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'hello world')
})

test('text should ignore GET request', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await text()(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'GET is ignored')
})

test('should parse raw body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await raw()(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end(req.body)
  })

  await makeFetch(server)('/', {
    body: 'hello world',
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'hello world')
})

test('raw should ignore GET request', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await raw()(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'GET is ignored')
})

test('should parse custom body', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await custom((d) => d.toUpperCase())(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end(req.body)
  })

  await makeFetch(server)('/', {
    body: 'hello world',
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'HELLO WORLD')
})

test('custom should ignore GET request', async () => {
  const server = createServer(async (req: ReqWithBody, res) => {
    await custom((d) => d.toUpperCase())(req, res, () => undefined)

    res.setHeader('Content-Type', 'text/plain')

    res.end('GET is ignored')
  })

  await makeFetch(server)('/', {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain'
    }
  }).expect(200, 'GET is ignored')
})
