import type { IncomingHttpHeaders } from "node:http"
import { it, expect } from "vitest"

import { parseHttpHeader } from "@/parsers/http-headers";

it("should parse valid headers", () => {
  const parsed: IncomingHttpHeaders = {}
  
  parseHttpHeader("content-type: application/json", parsed)
  parseHttpHeader("content-disposition: attachment; filename=foo.json", parsed)
  parseHttpHeader("content-length: 24", parsed)
  
  expect(parsed).toEqual({
    "content-type": "application/json",
    "content-disposition": "attachment; filename=foo.json",
    "content-length": "24",
  })
})

it("should lower-case field names", () => {
  const parsed: IncomingHttpHeaders = {}
  
  parseHttpHeader("Content-Type: application/json", parsed)
  parseHttpHeader("Content-Disposition: attachment; filename=foo.json", parsed)
  parseHttpHeader("Content-LenGtH: 24", parsed)
  
  expect(parsed).toEqual({
    "content-type": "application/json",
    "content-disposition": "attachment; filename=foo.json",
    "content-length": "24",
  })
})

it("should accept single-character field values", () => {
  const parsed: IncomingHttpHeaders = {}
  
  parseHttpHeader("foo: 1", parsed)
  parseHttpHeader("bar: 2", parsed)
  parseHttpHeader("baz: 3", parsed)
  
  expect(parsed).toEqual({
    foo: "1",
    bar: "2",
    baz: "3",
  })
})

it("should trim optional whitespace around header value", () => {
  const parsed: IncomingHttpHeaders = {}
  
  parseHttpHeader("Content-Type: \t\t application/json\t  ", parsed)
  parseHttpHeader("Content-Disposition:\t \tattachment;\tfilename=foo.json  ", parsed)
  parseHttpHeader("Content-LenGtH:\t24", parsed)
  
  expect(parsed).toEqual({
    "content-type": "application/json",
    "content-disposition": "attachment;\tfilename=foo.json",
    "content-length": "24",
  })
})

it("should throw on invalid header name", () => {
  expect(() => {
    parseHttpHeader("foo{}bar: baz", {})
  }).toThrow()
})

it("should throw on invalid header value", () => {
  expect(() => {
    parseHttpHeader("foobar: baz\u007fz", {})
  }).toThrow()
})

it("should throw when field line is missing field name", () => {
  expect(() => {
    parseHttpHeader(": baz", {})
  }).toThrow()
})

it("should throw when field line is missing colon", () => {
  expect(() => {
    parseHttpHeader("foobar baz", {})
  }).toThrow()
})

it("should throw when field line is missing field value", () => {
  expect(() => {
    parseHttpHeader("foobar:  ", {})
  }).toThrow()
})
