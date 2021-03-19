import { MIME } from '../constants'

export function magic(buffer, ext = '') {
  if (buffer != null) {
    if (isJPEG(buffer))
      return MIME.JPEG
    if (isPNG(buffer))
      return MIME.PNG
    if (isTIFF(buffer))
      return MIME.TIFF
    if (isPDF(buffer))
      return MIME.PDF
    if (isGIF(buffer))
      return MIME.GIF
    if (isSVG(buffer))
      return MIME.SVG
    if (isWebP(buffer))
      return MIME.WEBP
    if (isAVIF(buffer) || ext.toLowerCase() === '.avif')
      return MIME.AVIF
    if (isHEIC(buffer))
      return MIME.HEIC
    if (isJP2(buffer) || (/^\.j(p2|px|2k)$/i).test(ext))
      return MIME.JP2
  }
}

const isGIF = (buffer) =>
  check(buffer, [0x47, 0x49, 0x46])

const isHEIC = (buffer) =>
  (/^ftyp((hei|hev)[cms]|heix|mif1)$/).test(buffer.toString('ascii', 4, 12))

const isAVIF = (buffer) =>
  (/^ftyp(avif)$/).test(buffer.toString('ascii', 4, 12))

const isJPEG = (buffer) =>
  check(buffer, [0xFF, 0xD8, 0xFF])

const isJP2 = (buffer) =>
  check(buffer, [
    0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A
  ])

const isPNG = (buffer) =>
  check(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const isPDF = (buffer) =>
  check(buffer, [0x25, 0x50, 0x44, 0x46])

const isTIFF = (buffer) =>
  check(buffer, [0x49, 0x49, 42, 0]) || check(buffer, [0x4d, 0x4d, 0, 42])

const isWebP = (buffer) =>
  check(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    check(buffer, [0x57, 0x45, 0x42, 0x50], 8)

const isSVG = (buffer) =>
  !isBinary(buffer) && isSVGString(buffer.toString())


const check = (buffer, bytes, offset = 0) =>
  buffer.slice(offset, offset + bytes.length).compare(Buffer.from(bytes)) === 0

const SVG = {
// eslint-disable-next-line max-len
  HEAD: /^\s*(?:<\?xml[^>]*>\s*)?(?:<!doctype svg[^>]*\s*(?:<![^>]*>)*[^>]*>\s*)?<svg[^>]*>/i,
  COMMENTS: /<!--([\s\S]*?)-->/g
}

const isSVGString = (string) =>
  SVG.HEAD.test(string.replace(SVG.COMMENTS, ''))

const isBinary = (buffer) => {
  for (let i = 0; i < 24; ++i) {
    if (buffer[i] === 65533 || buffer[i] <= 8)
      return true
  }

  return false
}
