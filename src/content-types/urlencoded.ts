import { hasNoBody } from "@/utils/has-no-body";
import { getRead } from "@/get-read";
import type { ReqWithBody, NextFunction } from "@/types";
import createHttpError from "http-errors";

export const urlencoded = () => {
  const read = getRead(
    (x) => {
      const urlSearchParam = new URLSearchParams(x.toString())
      return Object.fromEntries(urlSearchParam.entries())
    },
    {
      preVerify: (req, res, charset) => {
        if (charset !== "utf-8") throw createHttpError("URL")
      }
    }
  )
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
