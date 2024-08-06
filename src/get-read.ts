import { ReqWithBody } from "./types";

export const getRead = <T = unknown>(fn: (body: string) => T) => {
  return async (req: ReqWithBody<T>, _res: Response, next: (err?: unknown) => void) => {
    try {
      let body = ''

      for await (const chunk of req) body += chunk

      return fn(body)
    } catch (e) {
      next(e)
    }
  }
}
