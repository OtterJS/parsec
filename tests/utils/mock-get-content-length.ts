import { vi } from 'vitest'

import type { getContentLength } from '@/utils/get-request-content-length'

vi.mock<{ getContentLength: typeof getContentLength }>(
  import('@/utils/get-request-content-length'),
  async (importOriginal) => {
    const module: { getContentLength: typeof getContentLength } = await importOriginal()

    return {
      getContentLength: vi.fn(module.getContentLength),
    } satisfies { getContentLength: typeof getContentLength }
  },
)
