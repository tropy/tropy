import { open } from './sharp.js'

export async function prepare ({ buffer, ...raw }, {
  grayscale = false,
  quality = 80,
  resize = false, // TODO
  type
} = {}) {
  let image = await open(buffer, { raw })

  if (type == null) {
    let stats = await image.clone().stats()
    type = stats.isOpaque ? 'jpeg' : 'png'
  }

  let body = await image
    .grayscale(grayscale)
    .toFormat(type, type === 'jpeg' ? { quality } : {})
    .toBuffer()

  return { buffer: body, type }
}
