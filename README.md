# @otterjs/parsec

**HTTP request body-parsing for modern Node.js.**

> :pushpin: This project is a fork of [tinyhttp/milliparsec](https://github.com/tinyhttp/milliparsec).

[![npm][npm-img]][npm-url]
[![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Coverage][cov-img]][cov-url]

## Features

- ⏩ built with `async` / `await
- 🛠 support for
  - JSON
  - urlencoded
  - text
- 🔥 no dependencies
- ✨ [tinyhttp](https://github.com/tinyhttp/tinyhttp) and Express support
- ⚡ 30% faster than body-parser

## Install

```sh
# pnpm
pnpm i @otterjs/parsec

# yarn
yarn add @otterjs/parsec

# npm
npm i @otterjs/parsec
```

## Usage

### Basic example

Use a middleware inside a server:

```js
import { createServer } from 'http'
import { json } from '@otterjs/parsec'

const parseJsonBody = json()

const server = createServer(async (req: ReqWithBody, res) => {
  await parseJsonBody(req, res, (err) => void console.log(err))

  res.setHeader('Content-Type', 'application/json')

  res.end(JSON.stringify(req.body))
})
```

### Web frameworks integration

#### tinyhttp

```ts
import { App } from '@tinyhttp/app'
import { urlencoded } from '@otterjs/parsec'

new App()
  .use(urlencoded())
  .post('/', (req, res) => void res.send(req.body))
  .listen(3000, () => console.log(`Started on http://localhost:3000`))
```

## API

### `raw(req, res, cb)`

Minimal body parsing without any formatting.

### `text(req, res, cb)`

Converts request body to string.

### `urlencoded(req, res, cb)`

Parses request body using `new URLSearchParams`.

### `json(req, res, cb)`

Parses request body using `JSON.parse`.

### `custom(fn)(req, res, cb)`

Custom function for `parsec`.

```js
// curl -d "this text must be uppercased" localhost
await custom(
  req,
  (d) => d.toUpperCase(),
  (err) => {}
)
res.end(req.body) // "THIS TEXT MUST BE UPPERCASED"
```

### What does "parsec" mean?

The parsec is a unit of length used to measure large distances to astronomical objects outside the Solar System.

[npm-url]: https://npmjs.com/package/@otterjs/parsec
[npm-img]: https://img.shields.io/npm/dt/@otterjs/parsec?style=for-the-badge&color=blueviolet
[github-actions]: https://github.com/otterjs/parsec/actions
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/otterjs/parsec/ci.yml?style=for-the-badge&logo=github&label=&color=blueviolet
[cov-url]: https://coveralls.io/github/OtterJS/parsec
[cov-img]: https://img.shields.io/coveralls/github/OtterJS/parsec?style=for-the-badge&color=blueviolet