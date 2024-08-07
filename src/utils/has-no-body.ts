const verbsWithNoBody = ['DELETE', 'GET', 'TRACE', 'OPTIONS', 'HEAD']
export const hasNoBody = (method: string | undefined) => method == null || verbsWithNoBody.includes(method)
