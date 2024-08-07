import { hasNoBody } from "@/utils/has-no-body";
import { getRead } from "@/get-read";
import type { ReqWithBody, Response, NextFunction } from "@/types";
import createHttpError from "http-errors";

export const urlencoded = () => {
  const read = getRead(
    (x) => {
      const urlSearchParam = new URLSearchParams(x.toString())
      return Object.fromEntries(urlSearchParam.entries())
    },
    {
      preVerify: (req, res, charset) => {
        if (charset != null && charset !== "utf-8") throw createHttpError(400, "urlencoded content may only use the UTF-8 character set")
      },
      defaultCharset: "utf-8"
    }
  )
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
