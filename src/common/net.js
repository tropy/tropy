import { attempt, delay } from './util.js'

function retryAfter (headers, min = 10_000, max = 300_000) {
  return Math.min(Number(headers.get('retry-after')) * 1000 || min, max)
}

export async function retry (resource, {
  maxRetries = 8,
  minBackoff = 250,
  numRetries = 0,
  ...options
} = {}) {
  options.signal?.throwIfAborted()

  let res = await attempt(fetch, {
    maxRetries,
    minBackoff
  }, resource, options)

  if (numRetries < maxRetries) {
    if (res.status === 429 || res.status === 503) {
      await delay(retryAfter(res.headers), null, {
        signal: options.signal
      })
      return retry(resource, {
        maxRetries,
        minBackoff,
        numRetries: numRetries + 1,
        ...options
      })
    }
  }

  return res
}
