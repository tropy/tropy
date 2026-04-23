// Minimal read-only PDF parser. Drop-in replacement for the subset of
// pdf-lib (https://pdf-lib.js.org) that this project consumes.
//
// Implemented:
//   - PDFDocument.load(buffer), doc.catalog, doc.getPages()
//   - PDFPage.node.Resources(), PDFPage.getMediaBox()
//   - PDFDict / PDFArray / PDFStream / PDFRawStream / PDFName / PDFString /
//     PDFHexString / PDFNumber / PDFRef / PDFNull / PDFBool object types
//   - Indirect ref resolution, classic xref tables, xref streams (PDF 1.5+),
//     object streams (PDF 1.5+)
//   - decodePDFRawStream — FlateDecode via node:zlib, with PNG predictor
//
// Not implemented (we don't use it):
//   - Writing
//   - Encryption (pdf-lib's `ignoreEncryption: true` is implicit here)
//   - Filter decoders other than FlateDecode (DCT/JPX/CCITT/JBIG2 stream
//     bytes pass through raw — that's the whole point of extraction)

import { inflateSync } from 'node:zlib'

// -- PDF object types --------------------------------------------------------

export class PDFObject {}

export class PDFNull extends PDFObject {
  static instance = new PDFNull()
}

export class PDFBool extends PDFObject {
  constructor (value) { super(); this.value = value }
  static TRUE = new PDFBool(true)
  static FALSE = new PDFBool(false)
}

export class PDFNumber extends PDFObject {
  constructor (value) { super(); this.value = value }
  asNumber () { return this.value }
}

export class PDFString extends PDFObject {
  constructor (value) { super(); this.value = value }
  asString () { return this.value }
}

export class PDFHexString extends PDFObject {
  constructor (hex) { super(); this.hex = hex }

  decodeText () {
    let bytes = []
    let h = this.hex
    if (h.length % 2) h += '0'
    for (let i = 0; i < h.length; i += 2) {
      bytes.push(parseInt(h.slice(i, i + 2), 16))
    }
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      let chars = []
      for (let i = 2; i + 1 < bytes.length; i += 2) {
        chars.push((bytes[i] << 8) | bytes[i + 1])
      }
      return String.fromCharCode(...chars)
    }
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return Buffer.from(bytes.slice(3)).toString('utf-8')
    }
    return String.fromCharCode(...bytes)
  }
}

const NAME_CACHE = new Map()
export class PDFName extends PDFObject {
  constructor (value) { super(); this.value = value }

  static of (str) {
    let cached = NAME_CACHE.get(str)
    if (!cached) {
      cached = new PDFName(str)
      NAME_CACHE.set(str, cached)
    }
    return cached
  }
}

export class PDFRef {
  constructor (num, gen) { this.num = num; this.gen = gen }
}

export class PDFArray extends PDFObject {
  constructor (context) {
    super()
    this.context = context
    this.array = []
  }

  push (value) { this.array.push(value) }
  size () { return this.array.length }

  lookup (i, type) {
    let v = this.array[i]
    if (v instanceof PDFRef) v = this.context.lookup(v)
    if (type !== undefined && !(v instanceof type)) return undefined
    return v
  }

  *[Symbol.iterator] () {
    for (let v of this.array) {
      yield v instanceof PDFRef ? this.context.lookup(v) : v
    }
  }
}

export class PDFDict extends PDFObject {
  constructor (context) {
    super()
    this.context = context
    this.map = new Map()
  }

  set (name, value) { this.map.set(name, value) }
  get (name) { return this.map.get(name) }

  lookup (name, type) {
    let v = this.map.get(name)
    if (v instanceof PDFRef) v = this.context.lookup(v)
    if (type !== undefined && !(v instanceof type)) return undefined
    return v
  }

  lookupMaybe (name, type) {
    return this.lookup(name, type)
  }

  *entries () {
    for (let [k, v] of this.map) {
      yield [k, v instanceof PDFRef ? this.context.lookup(v) : v]
    }
  }
}

export class PDFStream extends PDFObject {
  constructor (dict) {
    super()
    this.dict = dict
  }
}

export class PDFRawStream extends PDFStream {
  constructor (dict, contents) {
    super(dict)
    this.contents = contents
  }
}

class PDFPageLeaf extends PDFDict {
  static fromDict (dict) {
    let leaf = new PDFPageLeaf(dict.context)
    for (let [k, v] of dict.map) leaf.map.set(k, v)
    return leaf
  }

  Resources () {
    return inheritedAttribute(this, PDFName.of('Resources'))
  }
}

function inheritedAttribute (node, name) {
  let cur = node
  while (cur instanceof PDFDict) {
    let v = cur.lookup(name)
    if (v !== undefined) return v
    cur = cur.lookup(PDFName.of('Parent'))
  }
  return undefined
}

// -- Stream decoding ---------------------------------------------------------

export function decodePDFRawStream (stream) {
  return {
    decode () {
      return decodeStream(stream.contents, stream.dict)
    }
  }
}

const Filter = PDFName.of('Filter')
const DecodeParms = PDFName.of('DecodeParms')
const Predictor = PDFName.of('Predictor')
const Columns = PDFName.of('Columns')
const Colors = PDFName.of('Colors')
const BitsPerComponent = PDFName.of('BitsPerComponent')

function decodeStream (bytes, dict) {
  let filter = dict.lookup(Filter)
  let parms = dict.lookup(DecodeParms)

  let filters = []
  let parmsList = []

  if (filter instanceof PDFName) {
    filters.push(filter)
    parmsList.push(parms instanceof PDFDict ? parms : null)
  } else if (filter instanceof PDFArray) {
    for (let i = 0; i < filter.size(); i++) {
      filters.push(filter.lookup(i))
      let p = parms instanceof PDFArray ? parms.lookup(i) : null
      parmsList.push(p instanceof PDFDict ? p : null)
    }
  }

  let result = bytes
  for (let i = 0; i < filters.length; i++) {
    result = applyFilter(result, filters[i], parmsList[i])
  }
  return result
}

function applyFilter (bytes, filter, parms) {
  let name = filter?.value
  if (name === 'FlateDecode' || name === 'Fl') {
    let inflated = new Uint8Array(inflateSync(Buffer.from(bytes)))
    let predictor = parms?.lookup(Predictor)?.asNumber?.() ?? 1
    if (predictor > 1) inflated = applyPNGPredictor(inflated, parms, predictor)
    return inflated
  }
  throw new Error(`unsupported PDF filter: ${name}`)
}

function applyPNGPredictor (bytes, parms) {
  let columns = parms.lookup(Columns)?.asNumber?.() ?? 1
  let colors = parms.lookup(Colors)?.asNumber?.() ?? 1
  let bpc = parms.lookup(BitsPerComponent)?.asNumber?.() ?? 8

  let bpp = Math.ceil(colors * bpc / 8)
  let rowLen = Math.ceil(columns * colors * bpc / 8)
  let rowLenWithTag = rowLen + 1
  let rows = Math.floor(bytes.length / rowLenWithTag)

  let out = new Uint8Array(rows * rowLen)
  let prev = new Uint8Array(rowLen)

  for (let r = 0; r < rows; r++) {
    let tag = bytes[r * rowLenWithTag]
    let rowStart = r * rowLenWithTag + 1
    let outStart = r * rowLen

    for (let i = 0; i < rowLen; i++) {
      let left = i >= bpp ? out[outStart + i - bpp] : 0
      let up = prev[i]
      let upLeft = i >= bpp ? prev[i - bpp] : 0
      let v = bytes[rowStart + i]

      switch (tag) {
        case 0: break
        case 1: v = (v + left) & 0xff; break
        case 2: v = (v + up) & 0xff; break
        case 3: v = (v + ((left + up) >> 1)) & 0xff; break
        case 4: v = (v + paeth(left, up, upLeft)) & 0xff; break
        default: throw new Error(`unsupported PNG predictor tag: ${tag}`)
      }
      out[outStart + i] = v
    }
    prev = out.subarray(outStart, outStart + rowLen)
  }
  return out
}

function paeth (a, b, c) {
  let p = a + b - c
  let pa = Math.abs(p - a)
  let pb = Math.abs(p - b)
  let pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

// -- Tokenizer / parser ------------------------------------------------------

const WS = new Set([0x00, 0x09, 0x0A, 0x0C, 0x0D, 0x20])
const DELIM = new Set([
  0x28, 0x29, 0x3C, 0x3E, 0x5B, 0x5D, 0x7B, 0x7D, 0x2F, 0x25
])

function isDigit (c) { return c >= 0x30 && c <= 0x39 }

class Parser {
  constructor (bytes, context) {
    this.bytes = bytes
    this.pos = 0
    this.context = context
  }

  eof () { return this.pos >= this.bytes.length }
  peek (off = 0) { return this.bytes[this.pos + off] }

  skipWhitespaceAndComments () {
    while (!this.eof()) {
      let c = this.peek()
      if (WS.has(c)) { this.pos++; continue }
      if (c === 0x25) { // '%' comment
        while (!this.eof() && this.peek() !== 0x0A && this.peek() !== 0x0D) {
          this.pos++
        }
        continue
      }
      break
    }
  }

  matchKeyword (kw) {
    let len = kw.length
    if (this.pos + len > this.bytes.length) return false
    for (let i = 0; i < len; i++) {
      if (this.bytes[this.pos + i] !== kw.charCodeAt(i)) return false
    }
    return true
  }

  consumeKeyword (kw) {
    if (!this.matchKeyword(kw)) {
      throw new Error(`expected keyword "${kw}" at offset ${this.pos}`)
    }
    this.pos += kw.length
  }

  parseObject () {
    this.skipWhitespaceAndComments()
    let c = this.peek()

    if (c === 0x3C) {
      if (this.peek(1) === 0x3C) return this.parseDict()
      return this.parseHexString()
    }
    if (c === 0x28) return this.parseString()
    if (c === 0x5B) return this.parseArray()
    if (c === 0x2F) return this.parseName()

    if (this.matchKeyword('true')) {
      this.pos += 4; return PDFBool.TRUE
    }
    if (this.matchKeyword('false')) {
      this.pos += 5; return PDFBool.FALSE
    }
    if (this.matchKeyword('null')) {
      this.pos += 4; return PDFNull.instance
    }

    return this.parseNumberOrRef()
  }

  parseName () {
    this.pos++ // skip /
    let start = this.pos
    while (!this.eof() && !WS.has(this.peek()) && !DELIM.has(this.peek())) {
      this.pos++
    }
    let raw = this.bytes.subarray(start, this.pos)
    let chars = []
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === 0x23 && i + 2 < raw.length) {
        chars.push(parseInt(
          String.fromCharCode(raw[i + 1], raw[i + 2]), 16))
        i += 2
      } else {
        chars.push(raw[i])
      }
    }
    return PDFName.of(String.fromCharCode(...chars))
  }

  parseString () {
    this.pos++ // skip (
    let depth = 1
    let out = []
    while (!this.eof() && depth > 0) {
      let c = this.peek()
      if (c === 0x5C) { // backslash
        this.pos++
        let n = this.peek()
        this.pos++
        switch (n) {
          case 0x6E: out.push(0x0A); break // \n
          case 0x72: out.push(0x0D); break // \r
          case 0x74: out.push(0x09); break // \t
          case 0x62: out.push(0x08); break // \b
          case 0x66: out.push(0x0C); break // \f
          case 0x28: out.push(0x28); break
          case 0x29: out.push(0x29); break
          case 0x5C: out.push(0x5C); break
          case 0x0A: break
          case 0x0D:
            if (this.peek() === 0x0A) this.pos++
            break
          default:
            if (n >= 0x30 && n <= 0x37) { // octal
              let oct = n - 0x30
              for (let i = 0; i < 2; i++) {
                let m = this.peek()
                if (m >= 0x30 && m <= 0x37) {
                  oct = oct * 8 + (m - 0x30); this.pos++
                } else break
              }
              out.push(oct & 0xff)
            } else {
              out.push(n)
            }
        }
        continue
      }
      if (c === 0x28) depth++
      else if (c === 0x29) { depth--; if (depth === 0) { this.pos++; break } }
      out.push(c)
      this.pos++
    }
    return new PDFString(String.fromCharCode(...out))
  }

  parseHexString () {
    this.pos++ // skip <
    let chars = []
    while (!this.eof() && this.peek() !== 0x3E) {
      let c = this.peek()
      if (!WS.has(c)) chars.push(String.fromCharCode(c))
      this.pos++
    }
    this.pos++ // skip >
    return new PDFHexString(chars.join(''))
  }

  parseArray () {
    this.pos++ // skip [
    let arr = new PDFArray(this.context)
    while (true) {
      this.skipWhitespaceAndComments()
      if (this.eof()) throw new Error('unterminated array')
      if (this.peek() === 0x5D) { this.pos++; break }
      arr.push(this.parseObject())
    }
    return arr
  }

  parseDict () {
    this.pos += 2 // skip <<
    let dict = new PDFDict(this.context)
    while (true) {
      this.skipWhitespaceAndComments()
      if (this.eof()) throw new Error('unterminated dict')
      if (this.peek() === 0x3E && this.peek(1) === 0x3E) {
        this.pos += 2; break
      }
      let key = this.parseObject()
      if (!(key instanceof PDFName)) {
        throw new Error('expected name as dict key')
      }
      let value = this.parseObject()
      dict.set(key, value)
    }
    return dict
  }

  // Could be an integer, real, or the start of an indirect ref "N G R".
  parseNumberOrRef () {
    this.skipWhitespaceAndComments()
    let start = this.pos
    let c = this.peek()
    if (c === 0x2B || c === 0x2D) this.pos++ // sign
    let sawDigit = false
    let sawDot = false
    while (!this.eof()) {
      let ch = this.peek()
      if (isDigit(ch)) { sawDigit = true; this.pos++ }
      else if (ch === 0x2E && !sawDot) { sawDot = true; this.pos++ }
      else break
    }
    if (!sawDigit) {
      throw new Error(`expected number at offset ${start}`)
    }
    let num = Number(
      String.fromCharCode(...this.bytes.subarray(start, this.pos)))

    if (sawDot) return new PDFNumber(num)

    // Possibly an indirect ref — peek ahead for "G R"
    let saved = this.pos
    this.skipWhitespaceAndComments()
    let gStart = this.pos
    let gC = this.peek()
    if (isDigit(gC)) {
      while (!this.eof() && isDigit(this.peek())) this.pos++
      let gen = Number(
        String.fromCharCode(...this.bytes.subarray(gStart, this.pos)))
      this.skipWhitespaceAndComments()
      if (this.peek() === 0x52) { // 'R'
        this.pos++
        return new PDFRef(num, gen)
      }
    }
    this.pos = saved
    return new PDFNumber(num)
  }

  // Parse an indirect object body following "N G obj": dict + optional stream
  parseIndirectObjectBody () {
    let obj = this.parseObject()
    this.skipWhitespaceAndComments()
    if (obj instanceof PDFDict && this.matchKeyword('stream')) {
      this.pos += 6
      // Spec says stream keyword is followed by EOL (CRLF or LF)
      if (this.peek() === 0x0D) this.pos++
      if (this.peek() === 0x0A) this.pos++
      let length = obj.lookup(PDFName.of('Length'))
      let len = length instanceof PDFNumber ? length.value : null
      if (len == null) {
        throw new Error('stream missing Length')
      }
      let contents = this.bytes.subarray(this.pos, this.pos + len)
      this.pos += len
      return new PDFRawStream(obj, contents)
    }
    return obj
  }
}

// -- Cross-reference + document ----------------------------------------------

const Type = PDFName.of('Type')
const Size = PDFName.of('Size')
const W = PDFName.of('W')
const Index = PDFName.of('Index')
const Prev = PDFName.of('Prev')
const Root = PDFName.of('Root')
const N = PDFName.of('N')
const First = PDFName.of('First')
const Pages = PDFName.of('Pages')
const Kids = PDFName.of('Kids')
const Type_Page = PDFName.of('Page')
const MediaBox = PDFName.of('MediaBox')

class PDFContext {
  constructor (bytes) {
    this.bytes = bytes
    this.entries = new Map() // num -> { type: 1|2, offset, gen } | { type: 2, stmNum, idx }
    this.objects = new Map() // num -> PDFObject (cached)
    this.trailer = null
  }

  lookup (ref) {
    if (this.objects.has(ref.num)) return this.objects.get(ref.num)
    let entry = this.entries.get(ref.num)
    if (!entry) return undefined
    let obj
    if (entry.type === 1) {
      let parser = new Parser(this.bytes, this)
      parser.pos = entry.offset
      parser.skipWhitespaceAndComments()
      // skip "N G obj"
      parser.parseNumberOrRef() // num
      parser.parseNumberOrRef() // gen
      parser.skipWhitespaceAndComments()
      parser.consumeKeyword('obj')
      obj = parser.parseIndirectObjectBody()
    } else if (entry.type === 2) {
      obj = this.lookupCompressed(entry.stmNum, entry.idx)
    } else {
      return undefined
    }
    this.objects.set(ref.num, obj)
    return obj
  }

  lookupCompressed (stmNum, idx) {
    let stream = this.lookup(new PDFRef(stmNum, 0))
    if (!(stream instanceof PDFRawStream)) {
      throw new Error(`object stream ${stmNum} not found`)
    }
    let n = stream.dict.lookup(N)?.asNumber?.() ?? 0
    let first = stream.dict.lookup(First)?.asNumber?.() ?? 0
    let decoded = decodeStream(stream.contents, stream.dict)

    // Header: N pairs of "objNum offset"
    let parser = new Parser(decoded, this)
    let offsets = []
    for (let i = 0; i < n; i++) {
      parser.skipWhitespaceAndComments()
      parser.parseNumberOrRef() // objNum
      parser.skipWhitespaceAndComments()
      let off = parser.parseNumberOrRef()
      offsets.push(off.value)
    }
    parser.pos = first + offsets[idx]
    return parser.parseObject()
  }
}

function findStartXref (bytes) {
  // Search the last 1024 bytes for "startxref"
  let tail = Math.max(0, bytes.length - 1024)
  let needle = [0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66] // 'startxref'
  for (let i = bytes.length - needle.length; i >= tail; i--) {
    let match = true
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) { match = false; break }
    }
    if (match) {
      let p = new Parser(bytes, null)
      p.pos = i + needle.length
      p.skipWhitespaceAndComments()
      let n = p.parseNumberOrRef()
      return n.value
    }
  }
  throw new Error('startxref not found')
}

function readXref (context, offset) {
  let parser = new Parser(context.bytes, context)
  parser.pos = offset
  parser.skipWhitespaceAndComments()

  if (parser.matchKeyword('xref')) {
    return readClassicXref(context, parser)
  }
  return readXrefStream(context, parser)
}

function readClassicXref (context, parser) {
  parser.consumeKeyword('xref')
  parser.skipWhitespaceAndComments()
  while (true) {
    if (parser.matchKeyword('trailer')) break
    let firstNum = parser.parseNumberOrRef().value
    parser.skipWhitespaceAndComments()
    let count = parser.parseNumberOrRef().value
    parser.skipWhitespaceAndComments()
    for (let i = 0; i < count; i++) {
      // Each entry is exactly 20 bytes: "OOOOOOOOOO GGGGG f|n \n"
      let line = String.fromCharCode(
        ...context.bytes.subarray(parser.pos, parser.pos + 20))
      parser.pos += 20
      let off = parseInt(line.slice(0, 10), 10)
      let gen = parseInt(line.slice(11, 16), 10)
      let kind = line[17]
      let num = firstNum + i
      if (kind === 'n' && !context.entries.has(num)) {
        context.entries.set(num, { type: 1, offset: off, gen })
      }
    }
  }
  parser.consumeKeyword('trailer')
  parser.skipWhitespaceAndComments()
  let trailer = parser.parseObject()
  if (!context.trailer) context.trailer = trailer
  let prev = trailer.lookup(Prev)
  if (prev instanceof PDFNumber) readXref(context, prev.value)
}

function readXrefStream (context, parser) {
  // It's an indirect object: "N G obj << ... >> stream\n...endstream"
  parser.parseNumberOrRef() // num
  parser.parseNumberOrRef() // gen
  parser.skipWhitespaceAndComments()
  parser.consumeKeyword('obj')
  let stream = parser.parseIndirectObjectBody()
  if (!(stream instanceof PDFRawStream)) {
    throw new Error('xref stream is not a stream')
  }
  if (!context.trailer) context.trailer = stream.dict

  let size = stream.dict.lookup(Size)?.asNumber?.() ?? 0
  let w = stream.dict.lookup(W)
  if (!(w instanceof PDFArray) || w.size() < 3) {
    throw new Error('xref stream missing /W')
  }
  let w0 = w.lookup(0).asNumber()
  let w1 = w.lookup(1).asNumber()
  let w2 = w.lookup(2).asNumber()
  let entryLen = w0 + w1 + w2

  let index = stream.dict.lookup(Index)
  let sections
  if (index instanceof PDFArray) {
    sections = []
    for (let i = 0; i < index.size(); i += 2) {
      sections.push([index.lookup(i).asNumber(), index.lookup(i + 1).asNumber()])
    }
  } else {
    sections = [[0, size]]
  }

  let data = decodeStream(stream.contents, stream.dict)

  let p = 0
  for (let [first, count] of sections) {
    for (let i = 0; i < count; i++) {
      let t = w0 === 0 ? 1 : readBE(data, p, w0)
      let f1 = readBE(data, p + w0, w1)
      let f2 = readBE(data, p + w0 + w1, w2)
      p += entryLen
      let num = first + i
      if (context.entries.has(num)) continue
      if (t === 1) {
        context.entries.set(num, { type: 1, offset: f1, gen: f2 })
      } else if (t === 2) {
        context.entries.set(num, { type: 2, stmNum: f1, idx: f2 })
      }
    }
  }

  let prev = stream.dict.lookup(Prev)
  if (prev instanceof PDFNumber) readXref(context, prev.value)
}

function readBE (bytes, offset, width) {
  let v = 0
  for (let i = 0; i < width; i++) v = (v << 8) | bytes[offset + i]
  return v
}

// -- Document / page wrappers ------------------------------------------------

export class PDFPage {
  constructor (leaf) { this.node = leaf }

  getMediaBox () {
    let arr = inheritedAttribute(this.node, MediaBox)
    if (!(arr instanceof PDFArray) || arr.size() < 4) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    let x1 = arr.lookup(0).asNumber()
    let y1 = arr.lookup(1).asNumber()
    let x2 = arr.lookup(2).asNumber()
    let y2 = arr.lookup(3).asNumber()
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
  }
}

export class PDFDocument {
  constructor (context) {
    this.context = context
    let rootRef = context.trailer.get(Root)
    this.catalog = context.lookup(rootRef)
    if (!(this.catalog instanceof PDFDict)) {
      throw new Error('catalog not found')
    }
  }

  static async load (input) {
    let bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    let context = new PDFContext(bytes)
    let xrefOffset = findStartXref(bytes)
    readXref(context, xrefOffset)
    return new PDFDocument(context)
  }

  getPages () {
    let pages = []
    let root = this.catalog.lookup(Pages)
    collectPages(root, pages)
    return pages
  }
}

function collectPages (node, pages) {
  if (!(node instanceof PDFDict)) return
  let type = node.lookup(Type)
  if (type === Type_Page) {
    let leaf = node instanceof PDFPageLeaf ? node : PDFPageLeaf.fromDict(node)
    pages.push(new PDFPage(leaf))
    return
  }
  let kids = node.lookup(Kids)
  if (!(kids instanceof PDFArray)) return
  for (let kid of kids) collectPages(kid, pages)
}
