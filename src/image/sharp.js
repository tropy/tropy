import { info } from '../common/log.js'

export let sharp

export async function init() {
  if (sharp == null) {
    sharp = (await import('sharp')).default

    info({
      cache: sharp.cache(),
      concurrency: sharp.concurrency(),
      simd: sharp.simd()
    }, 'sharp initialized')
  }
}

export const defaults = {
  failOn: 'none'
  // limitInputPixels: false
  // unlimited: true
}

export async function open(input, options = {}) {
  await init()
  return sharp(input, { ...defaults, ...options })
}

export async function toFile(file, ...args) {
  let image = await open(...args)
  return image.toFile(file)
}

export async function toBuffer(format, ...args) {
  let image = await open(...args)

  if (format)
    image.toFormat(format)

  return image.toBuffer()
}
