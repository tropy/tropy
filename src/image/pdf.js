import {
  PDFDocument,
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFStream,
  PDFString,
  decodePDFRawStream
} from '@cantoo/pdf-lib'
import { magic } from '../asset/magic.js'
import { IMAGE } from '../constants/index.js'
import { warn } from '../common/log.js'

const UF = PDFName.of('UF')
const F = PDFName.of('F')
const EF = PDFName.of('EF')
const Names = PDFName.of('Names')
const Kids = PDFName.of('Kids')
const EmbeddedFiles = PDFName.of('EmbeddedFiles')
const Collection = PDFName.of('Collection')
const Filter = PDFName.of('Filter')
const Subtype = PDFName.of('Subtype')
const XObject = PDFName.of('XObject')
const Width = PDFName.of('Width')
const Height = PDFName.of('Height')
const Image = PDFName.of('Image')
const DCTDecode = PDFName.of('DCTDecode')

async function load (buffer) {
  return PDFDocument.load(new Uint8Array(buffer), {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false
  })
}

function readPDFString (value) {
  if (value instanceof PDFString) return value.asString()
  if (value instanceof PDFHexString) return value.decodeText()
  return null
}

function collectNameTreeEntries (node, out) {
  if (!(node instanceof PDFDict)) return

  let names = node.lookupMaybe(Names, PDFArray)
  if (names) {
    for (let i = 0; i < names.size(); i += 2) {
      let key = readPDFString(names.lookup(i))
      let value = names.lookup(i + 1)
      if (key != null && value != null) {
        out.push({ key, value })
      }
    }
  }

  let kids = node.lookupMaybe(Kids, PDFArray)
  if (kids) {
    for (let i = 0; i < kids.size(); i++) {
      collectNameTreeEntries(kids.lookup(i, PDFDict), out)
    }
  }
}

function isCollection (doc) {
  return doc.catalog.get(Collection) != null
}

function getEmbeddedFileStream (fileSpec) {
  if (!(fileSpec instanceof PDFDict)) return null

  let ef = fileSpec.lookupMaybe(EF, PDFDict)
  if (!ef) return null

  let stream = ef.lookup(F)
  if (stream == null) {
    // fallback to any entry if /F is missing
    for (let [, value] of ef.entries()) {
      if (value != null) {
        stream = value
        break
      }
    }
  }
  return stream instanceof PDFStream ? stream : null
}

function getFileSpecName (fileSpec, fallback) {
  if (!(fileSpec instanceof PDFDict)) return fallback
  return readPDFString(fileSpec.get(UF)) ||
    readPDFString(fileSpec.get(F)) ||
    fallback
}

function decodedStreamBytes (stream) {
  if (stream instanceof PDFRawStream) {
    let decoded = decodePDFRawStream(stream)
    return decoded.decode()
  }
  // Already-decoded stream types implement getContents()
  return stream.getContents()
}

export async function extractPortfolioImages (buffer) {
  try {
    let doc = await load(buffer)

    if (!isCollection(doc)) return null

    let names = doc.catalog.lookupMaybe(Names, PDFDict)
    if (!names) return null

    let embeddedFiles = names.lookupMaybe(EmbeddedFiles, PDFDict)
    if (!embeddedFiles) return null

    let entries = []
    collectNameTreeEntries(embeddedFiles, entries)

    let results = []
    for (let { key, value } of entries) {
      try {
        let fileSpec = value instanceof PDFDict ? value : null
        if (!fileSpec) continue

        let stream = getEmbeddedFileStream(fileSpec)
        if (!stream) continue

        let data = Buffer.from(decodedStreamBytes(stream))
        let mimetype = magic(data)
        if (!mimetype || !IMAGE.SUPPORTED[mimetype]) continue

        let name = getFileSpecName(fileSpec, key)
        results.push({ name, data, mimetype })

      } catch (err) {
        warn({ err, key }, 'failed to read embedded pdf file')
      }
    }

    return results

  } catch (err) {
    warn({ err }, 'failed to extract pdf portfolio images')
    return null
  }
}

// -- Page-level raw image extraction ------------------------------------

const cache = new WeakMap()

function getImageXObjects (page) {
  let resources = page.node.Resources()
  if (!resources) return []

  let xobjects = resources.lookupMaybe(XObject, PDFDict)
  if (!xobjects) return []

  let images = []
  for (let [, value] of xobjects.entries()) {
    if (!(value instanceof PDFStream)) continue
    if (value.dict.lookup(Subtype) !== Image) continue
    images.push(value)
  }
  return images
}

function isDCTOnly (filter) {
  if (filter == null) return false
  if (filter instanceof PDFName) return filter === DCTDecode
  if (filter instanceof PDFArray && filter.size() === 1) {
    return filter.lookup(0) === DCTDecode
  }
  return false
}

const MIN_PAGE_DPI = 100
const ASPECT_TOLERANCE = 0.2

// Returns { stream, dpi } if the page has exactly one image XObject AND
// that image plausibly fills the page (aspect-ratio match within tolerance,
// effective DPI above floor). Otherwise null.
function getPageImage (page) {
  let images = getImageXObjects(page)
  if (images.length !== 1) return null

  let { width: mbW, height: mbH } = page.getMediaBox()
  if (mbW <= 0 || mbH <= 0) return null

  let stream = images[0]
  let pxW = stream.dict.lookup(Width)?.asNumber?.() ?? 0
  let pxH = stream.dict.lookup(Height)?.asNumber?.() ?? 0
  if (pxW <= 0 || pxH <= 0) return null

  let imgAspect = pxW / pxH
  let pageAspect = mbW / mbH

  let directMatch =
    Math.abs(imgAspect - pageAspect) / pageAspect < ASPECT_TOLERANCE
  let rotatedMatch =
    Math.abs(imgAspect - 1 / pageAspect) * pageAspect < ASPECT_TOLERANCE

  if (!directMatch && !rotatedMatch) return null

  let dpi = directMatch
    ? pxW * 72 / mbW
    : pxW * 72 / mbH

  if (dpi < MIN_PAGE_DPI) return null

  return { stream, dpi }
}

function getJpegStream (page) {
  let pageImage = getPageImage(page)
  if (!pageImage) return null
  let { stream } = pageImage
  if (!(stream instanceof PDFRawStream)) return null
  if (!isDCTOnly(stream.dict.lookup(Filter))) return null
  return stream
}

function classify (buffer) {
  let cached = cache.get(buffer)
  if (cached) return cached

  let promise = (async () => {
    let doc = await load(buffer)
    let pages = doc.getPages()
    let isJpegCollection = pages.length > 0 &&
      pages.every(p => getJpegStream(p) != null)
    return { doc, isJpegCollection }
  })()

  cache.set(buffer, promise)
  return promise
}

// Inspect a single page. Returns one of:
//   { kind: 'jpeg', data: Buffer }     — raw JPEG bytes to write as-is
//   { kind: 'raster', dpi: number }    — fall back to Sharp at this DPI
//   null                               — fall back to Sharp at default DPI
export async function inspectPdfPage (buffer, pageIndex) {
  try {
    let { doc, isJpegCollection } = await classify(buffer)
    let pages = doc.getPages()
    if (pageIndex < 0 || pageIndex >= pages.length) return null

    let page = pages[pageIndex]
    let pageImage = getPageImage(page)
    if (!pageImage) return null

    if (isJpegCollection) {
      let stream = getJpegStream(page)
      if (stream) {
        return { kind: 'jpeg', data: Buffer.from(stream.contents) }
      }
    }

    return { kind: 'raster', dpi: pageImage.dpi }

  } catch (err) {
    warn({ err, pageIndex }, 'failed to inspect pdf page')
    return null
  }
}
