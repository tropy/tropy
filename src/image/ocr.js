import { open } from './sharp.js'

const MAX_SIZE = 15 * 1024 * 1024

export async function prepare ({ buffer: pixels, ...raw }, {
  grayscale = false,
  quality = 80,
  resize = false,
  type
} = {}) {
  let image = await open(pixels, { raw })

  if (type == null) {
    let { isOpaque } = await image.clone().stats()
    type = isOpaque ? 'jpeg' : 'png'
  }

  image.grayscale(grayscale)

  let options = (type === 'jpeg') ? { quality } : {}

  let buffer = await image
    .clone()
    .toFormat(type, options)
    .toBuffer()

  if (resize && buffer.length > MAX_SIZE) {
    let scale = Math.sqrt(MAX_SIZE / buffer.length)

    buffer = await image
      .resize({
        width: Math.round(raw.width * scale),
        withoutEnlargement: true
      })
      .toFormat(type, options)
      .toBuffer()
  }

  return { buffer, type }
}
