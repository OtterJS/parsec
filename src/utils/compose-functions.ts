export function compose<T extends unknown[]>(
  ...fns: Array<((...args: T) => void | Promise<void>) | undefined>
): (...args: T) => Promise<void> {
  return async (...args: T): Promise<void> => {
    for (const fn of fns) {
      await fn?.(...args)
    }
  }
}
