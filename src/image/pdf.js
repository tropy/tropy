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

const DRAWING_OPS = new Set([
  'Do',
  'Tj', 'TJ', "'", '"',
  'm', 'l', 'c', 'v', 'y', 're', 'h',
  'f', 'F', 'f*', 'S', 's', 'B', 'B*', 'b', 'b*', 'n',
  'sh',
  'BI', 'ID', 'EI'
])

// Tokenize a PDF content stream. Returns an array of operations, where each
// op is { operator: string, operands: Array<token> }. Tokens are primitive
// values (numbers, names with leading '/', or raw strings for other atoms).
function tokenize (bytes) {
  let ops = []
  let operands = []
  let i = 0
  let len = bytes.length

  let isWs = (c) =>
    c === 0x00 || c === 0x09 || c === 0x0A ||
    c === 0x0C || c === 0x0D || c === 0x20
  let isDelim = (c) =>
    c === 0x28 || c === 0x29 || c === 0x3C || c === 0x3E ||
    c === 0x5B || c === 0x5D || c === 0x7B || c === 0x7D ||
    c === 0x2F || c === 0x25

  let readName = () => {
    let start = ++i
    while (i < len && !isWs(bytes[i]) && !isDelim(bytes[i])) i++
    return '/' + String.fromCharCode(...bytes.subarray(start, i))
  }

  let readNumberOrOp = () => {
    let start = i
    while (i < len && !isWs(bytes[i]) && !isDelim(bytes[i])) i++
    let tok = String.fromCharCode(...bytes.subarray(start, i))
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tok)) {
      return { kind: 'number', value: Number(tok) }
    }
    return { kind: 'op', value: tok }
  }

  let skipString = () => {
    let depth = 1
    i++
    while (i < len && depth > 0) {
      let c = bytes[i]
      if (c === 0x5C) { i += 2; continue }
      if (c === 0x28) depth++
      else if (c === 0x29) depth--
      i++
    }
  }

  let skipHexString = () => {
    i++
    while (i < len && bytes[i] !== 0x3E) i++
    if (i < len) i++
  }

  let skipArray = () => {
    let depth = 1
    i++
    while (i < len && depth > 0) {
      let c = bytes[i]
      if (c === 0x5B) {
        depth++
      } else if (c === 0x5D) {
        depth--
      } else if (c === 0x28) {
        skipString()
        continue
      } else if (c === 0x3C) {
        if (bytes[i + 1] === 0x3C) {
          skipDict()
          continue
        } else {
          skipHexString()
          continue
        }
      }
      i++
    }
  }

  let skipDict = () => {
    let depth = 1
    i += 2
    while (i < len && depth > 0) {
      let c = bytes[i]
      if (c === 0x3C && bytes[i + 1] === 0x3C) { depth++; i += 2; continue }
      if (c === 0x3E && bytes[i + 1] === 0x3E) { depth--; i += 2; continue }
      if (c === 0x28) { skipString(); continue }
      if (c === 0x5B) { skipArray(); continue }
      i++
    }
  }

  let inInlineImage = false

  while (i < len) {
    let c = bytes[i]

    if (isWs(c)) { i++; continue }

    if (c === 0x25) { // '%' comment
      while (i < len && bytes[i] !== 0x0A && bytes[i] !== 0x0D) i++
      continue
    }

    if (inInlineImage) {
      // skip past 'EI'
      if (c === 0x45 && bytes[i + 1] === 0x49 &&
        (i + 2 >= len || isWs(bytes[i + 2]))) {
        ops.push({ operator: 'EI', operands: [] })
        inInlineImage = false
        i += 2
      } else {
        i++
      }
      continue
    }

    if (c === 0x28) { skipString(); operands.push({ kind: 'string' }); continue }
    if (c === 0x5B) { skipArray(); operands.push({ kind: 'array' }); continue }
    if (c === 0x3C) {
      if (bytes[i + 1] === 0x3C) {
        skipDict()
        operands.push({ kind: 'dict' })
      } else {
        skipHexString()
        operands.push({ kind: 'hexstring' })
      }
      continue
    }

    if (c === 0x2F) {
      operands.push({ kind: 'name', value: readName() })
      continue
    }

    let tok = readNumberOrOp()
    if (tok.kind === 'number') {
      operands.push(tok)
    } else {
      ops.push({ operator: tok.value, operands })
      if (tok.value === 'BI' || tok.value === 'ID') {
        inInlineImage = true
      }
      operands = []
    }
  }

  return ops
}

// Returns true if at most one Do op appears and it's the only drawing op.
// Also returns the operand (XObject name) and the CTM at the point of the Do.
function findSingleFullPageXObject (ops) {
  let ctm = [1, 0, 0, 1, 0, 0]
  let stack = []
  let doName = null
  let doCTM = null
  let drawingOps = 0

  for (let { operator, operands } of ops) {
    if (operator === 'q') {
      stack.push(ctm.slice())
      continue
    }
    if (operator === 'Q') {
      ctm = stack.pop() || [1, 0, 0, 1, 0, 0]
      continue
    }
    if (operator === 'cm') {
      if (operands.length >= 6) {
        let m = operands.slice(-6).map(o => o.value)
        ctm = multiply(m, ctm)
      }
      continue
    }
    if (DRAWING_OPS.has(operator)) {
      drawingOps++
      if (operator === 'Do' && operands.length > 0) {
        let name = operands[operands.length - 1]
        if (name.kind === 'name') {
          doName = name.value.slice(1)
          doCTM = ctm.slice()
        }
      }
    }
  }

  if (drawingOps !== 1 || doName == null) return null
  return { name: doName, ctm: doCTM }
}

function multiply (a, b) {
  // a, b are 6-element CTMs: [a b c d e f] representing
  // [a b 0; c d 0; e f 1]. Operation is a * b.
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5]
  ]
}

function renderedSize (ctm) {
  // The image occupies the unit square [0,1]x[0,1]. After applying CTM,
  // corners are at (0,0), (a,b), (c,d), (a+c, b+d). The rendered width/height
  // is the extent along the CTM's basis vectors.
  let w = Math.hypot(ctm[0], ctm[1])
  let h = Math.hypot(ctm[2], ctm[3])
  return { width: w, height: h }
}

function isDCTOnly (filter) {
  if (filter == null) return false
  if (filter instanceof PDFName) return filter === DCTDecode
  if (filter instanceof PDFArray) {
    if (filter.size() !== 1) return false
    let f = filter.lookup(0)
    return f === DCTDecode
  }
  return false
}

function getContentStreamBytes (page) {
  let contents = page.node.Contents()
  if (contents == null) return new Uint8Array(0)

  if (contents instanceof PDFArray) {
    let parts = []
    let total = 0
    for (let i = 0; i < contents.size(); i++) {
      let s = contents.lookup(i, PDFStream)
      let bytes = decodedStreamBytes(s)
      parts.push(bytes)
      total += bytes.length
    }
    let out = new Uint8Array(total)
    let offset = 0
    for (let p of parts) { out.set(p, offset); offset += p.length }
    return out
  }

  if (contents instanceof PDFStream) {
    return decodedStreamBytes(contents)
  }

  return new Uint8Array(0)
}

function getXObjectStream (page, name) {
  let resources = page.node.Resources()
  if (!resources) return null

  let xobjects = resources.lookupMaybe(XObject, PDFDict)
  if (!xobjects) return null

  let stream = xobjects.lookup(PDFName.of(name))
  return stream instanceof PDFStream ? stream : null
}

// Inspect a single page. Returns one of:
//   { kind: 'jpeg', data: Buffer }            — raw JPEG bytes to write as-is
//   { kind: 'raster', dpi: number }           — fall back to Sharp at this DPI
//   null                                      — fall back to Sharp at default DPI
export async function inspectPdfPage (buffer, pageIndex) {
  try {
    let doc = await load(buffer)
    let pages = doc.getPages()
    if (pageIndex < 0 || pageIndex >= pages.length) return null

    let page = pages[pageIndex]
    let { width: mbW, height: mbH } = page.getMediaBox()
    if (mbW <= 0 || mbH <= 0) return null

    let ops = tokenize(getContentStreamBytes(page))
    let found = findSingleFullPageXObject(ops)
    if (!found) return null

    let xobj = getXObjectStream(page, found.name)
    if (!xobj) return null

    let dict = xobj.dict
    if (dict.lookup(Subtype) !== PDFName.of('Image')) return null

    let { width: rW, height: rH } = renderedSize(found.ctm)
    let coverage = (rW * rH) / (mbW * mbH)
    if (!(coverage >= 0.98)) return null

    let pixelW = dict.lookup(Width)
    if (pixelW == null) return null
    let pxW = pixelW.asNumber?.() ?? Number(pixelW)
    let pixelH = dict.lookup(Height)
    let pxH = pixelH?.asNumber?.() ?? Number(pixelH)

    let filter = dict.lookup(Filter)
    if (isDCTOnly(filter) && xobj instanceof PDFRawStream) {
      return { kind: 'jpeg', data: Buffer.from(xobj.contents) }
    }

    if (pxW > 0 && mbW > 0) {
      let dpi = pxW / (mbW / 72)
      return { kind: 'raster', dpi, width: pxW, height: pxH }
    }

    return null

  } catch (err) {
    warn({ err, pageIndex }, 'failed to inspect pdf page')
    return null
  }
}
