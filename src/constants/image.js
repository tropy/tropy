import MIME from './mime'

const SUPPORTED = {
  [MIME.GIF]: true,
  [MIME.HEIC]: true,
  [MIME.HEIC_SEQ]: true,
  [MIME.HEIF]: true,
  [MIME.HEIF_SEQ]: true,
  [MIME.JPEG]: true,
  [MIME.JP2]: true,
  [MIME.J2K]: true,
  [MIME.JPX]: true,
  [MIME.PNG]: true,
  [MIME.PDF]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

export default {
  MIN_DENSITY: 1,
  MAX_DENSITY: 1200,

  EXT: [
    'gif',
    'heic',
    'heif',
    'jpg',
    'jpeg',
    'jp2',
    'jpx',
    'j2k',
    'pdf',
    'png',
    'svg',
    'tif',
    'tiff',
    'webp'
  ],

  WEB: {
    [MIME.JPG]: true,
    [MIME.PNG]: true,
    [MIME.WEBP]: true,
    [MIME.GIF]: true
    // [MIME.SVG]: true
  },

  SCALABLE: {
    [MIME.PDF]: true,
    [MIME.SVG]: true
  },

  SUPPORTED
}
