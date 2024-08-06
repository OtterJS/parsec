import { hasNoBody } from "@/utils";
import { getRead } from "@/get-read";
import type { ReqWithBody, NextFunction } from "@/types";

export const urlencoded = () => {
  const read = getRead((x) => {
    const urlSearchParam = new URLSearchParams(x.toString())
    return Object.fromEntries(urlSearchParam.entries())
  })
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res, next)
    next()
  }
}
