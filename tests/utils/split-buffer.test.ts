import { it, expect } from "vitest"

import { splitBuffer } from "@/utils/split-buffer";

it("should split correctly with string delimiter", () => {
  const toSplit = Buffer.from("abc foo bar foo baz foo quux foo \n")
  expect(splitBuffer(toSplit, " foo ", "utf-8")).toEqual([
    Buffer.from("abc"),
    Buffer.from("bar"),
    Buffer.from("baz"),
    Buffer.from("quux"),
    Buffer.from("\n")
  ])
})

it("should split correctly with buffer delimiter", () => {
  const toSplit = Buffer.from("abc foo bar foo baz foo quux foo \n")
  expect(splitBuffer(toSplit, Buffer.from(" foo "))).toEqual([
    Buffer.from("abc"),
    Buffer.from("bar"),
    Buffer.from("baz"),
    Buffer.from("quux"),
    Buffer.from("\n")
  ])
})
