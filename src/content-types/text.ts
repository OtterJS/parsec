import { hasNoBody } from "@/utils/has-no-body";
import { getRead } from "@/get-read";
import type { ReqWithBody, NextFunction } from "@/types";

export const text = () => {
  const read = getRead((x) => x.toString())
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
