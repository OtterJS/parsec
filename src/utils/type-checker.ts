import type { Request } from '@/types'
import { type ContentType, typeIs } from '@otterhttp/type-is'

/**
 * Get the simple type checker.
 *
 * @param types
 */
export function typeChecker(...types: readonly (string | ContentType)[]) {
  return (req: Request): boolean => {
    return Boolean(typeIs(req, types))
  }
}
