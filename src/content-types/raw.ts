import { hasNoBody } from "@/utils/has-no-body";
import { getRawRead } from "@/get-read";
import type { ReqWithBody, Response, NextFunction } from "@/types";

export const raw = () => {
  const read = getRawRead()
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    if (hasNoBody(req.method)) return next()
    req.body = await read(req, res)
    next()
  }
}
