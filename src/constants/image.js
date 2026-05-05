import MIME from './mime.js'

const RAW = {
  EXT: [
    '3fr',
    'ari',
    'arw',
    'bay',
    'bmq',
    'cap',
    'cine',
    'cr2',
    'cr3',
    'crw',
    'cs1',
    'dc2',
    'dcr',
    'dng',
    'erf',
    'fff',
    'gpr',
    'iiq',
    'k25',
    'kc2',
    'kdc',
    'mdc',
    'mef',
    'mos',
    'mrw',
    'nef',
    'nrw',
    'orf',
    'pef',
    'pxn',
    'qtk',
    'raf',
    'raw',
    'rdc',
    'rw1',
    'rw2',
    'rwl',
    'rwz',
    'sr2',
    'srf',
    'srw',
    'sti',
    'x3f'
  ],
  MIN_VIPS: '8.18.0'
}

const SUPPORTED = {
  [MIME.AVIF]: true,
  [MIME.AVIF_SEQ]: true,
  [MIME.EPS]: true,
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
  [MIME.PS]: true,
  [MIME.RAW]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

export default {
  MIN_DENSITY: 1,
  MAX_DENSITY: 1200,

  EXT: [
    'ai',
    'avif',
    'eps',
    'gif',
    'heic',
    'heif',
    'jpg',
    'jpeg',
    'jp2',
    'jpf',
    'jpx',
    'j2k',
    'pdf',
    'png',
    'ps',
    ...RAW.EXT,
    'svg',
    'tif',
    'tiff',
    'webp'
  ],

  WEB: {
    [MIME.AVIF]: true,
    [MIME.JPG]: true,
    [MIME.PNG]: true,
    [MIME.WEBP]: true,
    [MIME.GIF]: true
    // [MIME.SVG]: true
  },

  SCALABLE: {
    [MIME.EPS]: true,
    [MIME.PDF]: true,
    [MIME.PS]: true,
    [MIME.SVG]: true
  },

  RAW,

  SUPPORTED
}
