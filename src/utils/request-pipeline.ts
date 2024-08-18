import { PassThrough } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/**
 * Does what Node's [stream pipeline]{@link pipeline} function does, but ensures the `request` source stream
 * is not `.destroy()`ed by wrapping it in a {@link PassThrough} stream.
 */
export function requestPipeline(
  request: NodeJS.ReadableStream,
  streams: Array<NodeJS.WritableStream | NodeJS.ReadableStream>,
): Promise<unknown> {
  const sourceWrapper = new PassThrough()
  const requestErrorPromise = new Promise((_, reject) => {
    request.on('error', (err) => {
      reject(err)
      sourceWrapper.destroy(err)
    })
  })
  request.pipe(sourceWrapper)
  streams.unshift(sourceWrapper)
  const pipelinePromise = pipeline(streams)
  return Promise.race([pipelinePromise, requestErrorPromise])
}
