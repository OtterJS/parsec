import { hasNoBody } from "@/utils";
import { getRead } from "@/get-read";
import type { ReqWithBody, NextFunction } from "@/types";

export const json = () => {
  const read = getRead((x) => (x ? JSON.parse(x.toString()) : {}))
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res, next)
    next()
  }
}