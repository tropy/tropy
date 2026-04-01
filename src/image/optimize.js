import { createHash } from 'node:crypto'
import { open } from './sharp.js'
import { IMAGE, MIME } from '../constants/index.js'

export async function optimizeImage (buffer, {
  page = 0,
  mimetype,
  density = 72
} = {}) {
  if (mimetype === MIME.JPG)
    return null

  density = IMAGE.SCALABLE[mimetype] ? Number(density) : undefined
  let opts = { page }
  if (density != null) opts.density = density
  let image = await open(buffer, opts)
  let { isOpaque } = await image.stats()

  if (mimetype === MIME.PNG && !isOpaque)
    return null

  let ext, outputMimetype, outputBuffer
  if (isOpaque) {
    ext = '.jpg'
    outputMimetype = 'image/jpeg'
    outputBuffer = await image.jpeg({ quality: 100 }).toBuffer()
  } else {
    ext = '.png'
    outputMimetype = 'image/png'
    outputBuffer = await image.png().toBuffer()
  }

  let checksum = createHash('md5').update(outputBuffer).digest('hex')

  return { buffer: outputBuffer, ext, mimetype: outputMimetype, checksum }
}
