# parsec 🌌

![Twitter](https://img.shields.io/twitter/follow/v1rtl.svg?label=twitter&style=flat-square)
![Top lang](https://img.shields.io/github/languages/top/talentlessguy/parsec.svg?style=flat-square)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/body-parsec.svg?style=flat-square)
![Version](https://img.shields.io/npm/v/body-parsec.svg?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/talentlessguy/parsec.svg?style=flat-square)
![Minified size](https://img.shields.io/bundlephobia/min/body-parsec.svg?style=flat-square) ![Codecov](https://img.shields.io/codecov/c/gh/talentlessguy/parsec?style=flat-square)

Modern asynchronous body parser for Node.js.

It puts all the data into `req.body` so you don't have to create a separate array for it.

> parsec is a part of [tinyhttp](https://github.com/talentlessguy/tinyhttp) ecosystem.

## Features 👀

- works with Node 13+ ESM and CommonJS
- asynchronous ⌛
- JSON / raw / form / text data support ⏩
- tiny package size (826 b) 📦
- no dependencies 🔥
- filter requests (only POST, PUT and PATCH) ☔
- Koa & Express support

## Installation 🔄

```sh
# pnpm
pnpm i body-parsec

# yarn
yarn add body-parsec

# npm
npm i body-parsec
```

## Usage ⏩

### Basic example 🖐

Use a middleware inside a server:

```js
import { createServer } = from 'http'
import * as parsec from 'body-parsec'

createServer(async (req, res) => {
  const parsedData = await parsec.json()(req)
  console.log(parsedData) // { 'hello': 'world' }
  res.setHeader('Content-Type', 'application/json')
  res.end(req.body.hello)
}).listen(80)
```

Then try to make a request to our server:

```sh
curl -d '{ "hello": "world" }' localhost
```

After sending a request, it should output `world`.

### Parsec and web frameworks 💻

## [tinyhttp](https://github.com/talentlessguy/tinyhttp) ⚡

```ts
import { App } from '@tinyhttp/app'
import * as parsec from 'body-parsec'

const app = new App()

app
  .use(async (req, res, next) => await parsec.form()(req, res, next))
  .post('/', (req, res) => {
    res.send(req.body)
  })

app.listen(3000, () => console.log(`Started on http://localhost:3000`))
```

## Express

```ts
import Express from 'express'
import { form } from 'body-parsec'

const app = Express()

app.use(form())

app.get('/', (req, res) => {
  res.send(`
  <form method="POST" action="/">
  <input name="name" />
  </form>
  `)
})

app.post('/', (req, res) => {
  res.send(`Hello ${req.body.name}!`)
})

app.listen(3000, () => console.log(`Running on http://localhost:3000`))
```

## Koa

```ts
import Koa from 'koa'
import { json, CtxWithBody } from 'body-parsec/koa'

const app = new Koa()

app.use(json())

app.use((ctx: CtxWithBody) => {
  if (ctx.method === 'POST') {
    ctx.type = 'application/json'
    ctx.body = ctx.req.body
  }
})

app.listen(3000, () => console.log(`Running on http://localhost:3000`))
```

### API 📦

#### `parsec.raw(req)`

Minimal body parsing without any formatting (even without converting to string):

```js
// Request: curl -d "Hello World"
await parsec.raw()(req)
res.end(req.body) // "Hello World"
```

#### `parsec.text(req)`

Converts request body to string.

```js
// Request: curl -d "Hello World"
await parsec.text()(req)
res.end(req.body) // "Hello World"
```

#### `parsec.custom(req, fn)`

You can use `parsec` as a a handler for `IncomingMessage` with a custom formatter.

Here we make a request body upper case:

```js
// Request: curl -d "this text must be uppercased" localhost
await parsec.custom(req, (data) => data.toUpperCase())
res.end(req.body) // "THIS TEXT MUST BE UPPERCASED"
```

#### `parsec.json(req)`

If you need to parse a JSON request simply use `parsec.json` method:

```js
// Request: curl -d { "hello": "world" } localhost
await parsec.json()(req)
res.end(req.body.hello) // world
```

#### `parsec.form(req)`

Body parsers are mostly used to get data from forms. To get data from them, use `form` method:
You can try to play with HTML form example in

```js
// Request: curl -d 'username=pro_gamer'
await parsec.form()(req)
res.end(req.body.username) // pro_gamer
```

### What is "parsec"?

The parsec (symbol: pc) is a unit of length used to measure large distances to astronomical objects outside the Solar System.
