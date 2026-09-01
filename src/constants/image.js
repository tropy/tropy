import MIME from './mime.js'

const RAW = {
  '3fr': 'image/x-hasselblad-3fr',
  ari: null,
  arw: 'image/x-sony-arw',
  bay: null,
  bmq: null,
  cine: null,
  cr2: 'image/x-canon-cr2',
  cr3: 'image/x-canon-cr3',
  crw: 'image/x-canon-crw',
  cs1: null,
  dc2: null,
  dcr: 'image/x-kodak-dcr',
  dng: 'image/x-adobe-dng',
  erf: 'image/x-epson-erf',
  fff: 'image/x-hasselblad-fff',
  gpr: null,
  iiq: 'image/x-phaseone-iiq',
  k25: 'image/x-kodak-k25',
  kc2: null,
  kdc: 'image/x-kodak-kdc',
  mdc: 'image/x-minolta-mdc',
  mef: 'image/x-mamiya-mef',
  mos: 'image/x-leaf-mos',
  mrw: 'image/x-minolta-mrw',
  nef: 'image/x-nikon-nef',
  nrw: 'image/x-nikon-nrw',
  orf: 'image/x-olympus-orf',
  pef: 'image/x-pentax-pef',
  pxn: null,
  qtk: null,
  raf: 'image/x-fuji-raf',
  raw: 'image/x-panasonic-rw',
  rdc: null,
  rw1: null,
  rw2: 'image/x-panasonic-rw2',
  rwl: 'image/x-panasonic-rw2',
  rwz: null,
  sr2: 'image/x-sony-sr2',
  srf: 'image/x-sony-srf',
  srw: 'image/x-samsung-srw',
  sti: 'image/x-sinar-sti',
  x3f: 'image/x-sigma-x3f'
}

const FORMATS = {
  ai: 'application/illustrator',
  avif: 'image/avif',
  avifs: 'image/avif',
  eps: 'image/x-eps',
  epsf: 'image/x-eps',
  epsi: 'image/x-eps',
  gif: 'image/gif',
  heic: 'image/heif',
  heif: 'image/heif',
  hif: 'image/heif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  jfif: 'image/jpeg',
  jp2: 'image/jp2',
  jpg2: 'image/jp2',
  jpf: 'image/jpx',
  jpx: 'image/jpx',
  j2k: 'image/x-jp2-codestream',
  j2c: 'image/x-jp2-codestream',
  jpc: 'image/x-jp2-codestream',
  jxl: 'image/jxl',
  pdf: 'application/pdf',
  png: 'image/png',
  ps: 'application/postscript',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  webp: 'image/webp'
}

const EXT = [...Object.keys(FORMATS), ...Object.keys(RAW)]

const ASSOCIATIONS = [
  ...new Set([...Object.values(FORMATS), ...Object.values(RAW)])
].filter(Boolean)

// The image types we detect; see asset/magic.js
const SUPPORTED = {
  [MIME.AVIF]: true,
  [MIME.EPS]: true,
  [MIME.GIF]: true,
  [MIME.HEIC]: true,
  [MIME.JPEG]: true,
  [MIME.JP2]: true,
  [MIME.JXL]: true,
  [MIME.PDF]: true,
  [MIME.PNG]: true,
  [MIME.PS]: true,
  [MIME.RAW]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

export default {
  MIN_DENSITY: 1,
  MAX_DENSITY: 1200,

  EXT,
  ASSOCIATIONS,

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

  RAW: {
    EXT: Object.keys(RAW)
  },

  SUPPORTED
}
