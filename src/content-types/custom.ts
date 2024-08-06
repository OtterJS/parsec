import { getRead } from "@/get-read";
import type { ReqWithBody, NextFunction } from "@/types";

export const custom = <T = unknown>(fn: (body: string) => T) => {
  const read = getRead(fn)
  return async (req: ReqWithBody, res: Response, next: NextFunction) => {
    req.body = await read(req, res, next)
    next()
  }
}