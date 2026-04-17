import zlib from 'node:zlib'
import { magic } from '../asset/magic.js'
import { IMAGE } from '../constants/index.js'
import { warn } from '../common/log.js'

// eslint-disable-next-line no-control-regex
const WS = /[\x00\t\n\f\r ]/

export function isPdfPortfolio (buffer) {
  try {
    let xref = parseXref(buffer)
    if (!xref || xref.encrypted) return false

    let root = resolveObject(buffer, xref, xref.root)
    if (!root?.dict) return false

    let names = resolveRef(buffer, xref, root.dict.Names)
    if (!names?.dict) return false

    return names.dict.EmbeddedFiles != null

  } catch (err) {
    warn({ err }, 'failed to detect pdf portfolio')
    return false
  }
}

export function extractEmbeddedImages (buffer) {
  try {
    let xref = parseXref(buffer)
    if (!xref || xref.encrypted) return []

    let root = resolveObject(buffer, xref, xref.root)
    if (!root?.dict) return []

    let names = resolveRef(buffer, xref, root.dict.Names)
    if (!names?.dict?.EmbeddedFiles) return []

    let entries = []
    walkNameTree(buffer, xref, names.dict.EmbeddedFiles, entries)

    let results = []
    for (let { name, value } of entries) {
      try {
        let spec = resolveRef(buffer, xref, value)
        if (!spec?.dict?.EF) continue

        let streamRef = spec.dict.EF.F ?? spec.dict.EF.UF
        if (!streamRef) continue

        let stream = resolveRef(buffer, xref, streamRef)
        if (!stream?.stream) continue

        let decoded = decodeStream({
          dict: stream.dict,
          data: stream.stream
        })
        if (!decoded) continue

        let mimetype = magic(decoded)
        if (!mimetype || !IMAGE.SUPPORTED[mimetype]) continue

        let displayName = spec.dict.UF || spec.dict.F || name
        results.push({ name: displayName, data: decoded, mimetype })

      } catch (err) {
        warn({ err, name }, 'failed to extract embedded pdf file')
      }
    }

    return results

  } catch (err) {
    warn({ err }, 'failed to extract pdf portfolio images')
    return []
  }
}

function parseXref (buffer) {
  let startOffset = findStartXref(buffer)
  if (startOffset == null) return null

  let xref = { entries: new Map(), root: null, encrypted: false }
  let visited = new Set()
  let offset = startOffset

  while (offset != null && !visited.has(offset)) {
    visited.add(offset)

    let section = readXrefSection(buffer, offset)
    if (!section) return null

    for (let [num, entry] of section.entries) {
      if (!xref.entries.has(num)) xref.entries.set(num, entry)
    }

    if (xref.root == null && section.trailer?.Root) {
      xref.root = section.trailer.Root
    }
    if (!xref.encrypted && section.trailer?.Encrypt) {
      xref.encrypted = true
    }

    offset = section.trailer?.Prev ?? null
    if (typeof offset !== 'number') offset = null
  }

  if (xref.root == null) return null

  return xref
}

function findStartXref (buffer) {
  let search = Math.min(buffer.length, 8192)
  let tail = buffer.slice(buffer.length - search).toString('latin1')
  let idx = tail.lastIndexOf('startxref')
  if (idx < 0) return null

  let rest = tail.slice(idx + 'startxref'.length)
  let match = rest.match(/\s+(\d+)/)
  if (!match) return null

  return parseInt(match[1], 10)
}

function readXrefSection (buffer, offset) {
  // Peek for "xref" keyword vs xref stream object
  let head = buffer.slice(offset, offset + 16).toString('latin1')

  if (/^xref[\s]/.test(head)) {
    return readXrefTable(buffer, offset)
  }
  return readXrefStream(buffer, offset)
}

function readXrefTable (buffer, offset) {
  let str = buffer.slice(offset).toString('latin1')
  let idx = 0

  let m = /^xref[\s]+/.exec(str)
  if (!m) return null
  idx = m[0].length

  let entries = new Map()

  while (true) {
    let sub = /^(\d+)\s+(\d+)\s*\r?\n/.exec(str.slice(idx))
    if (!sub) break

    let first = parseInt(sub[1], 10)
    let count = parseInt(sub[2], 10)
    idx += sub[0].length

    for (let i = 0; i < count; i++) {
      let line = str.slice(idx, idx + 20)
      idx += 20

      let e = /^(\d{10}) (\d{5}) (n|f)/.exec(line)
      if (!e) continue

      let num = first + i
      if (e[3] === 'n') {
        entries.set(num, {
          type: 1,
          offset: parseInt(e[1], 10),
          gen: parseInt(e[2], 10)
        })
      }
    }
  }

  // Find trailer
  let tIdx = str.indexOf('trailer', idx)
  if (tIdx < 0) return { entries, trailer: null }

  let dictStart = str.indexOf('<<', tIdx)
  if (dictStart < 0) return { entries, trailer: null }

  let { dict } = parseDict(str, dictStart)

  return { entries, trailer: dict }
}

function readXrefStream (buffer, offset) {
  let obj = readObjectAt(buffer, offset)
  if (!obj?.dict || !obj.stream) return null

  let W = obj.dict.W
  if (!Array.isArray(W) || W.length !== 3) return null

  let size = obj.dict.Size
  if (typeof size !== 'number') return null

  let index = obj.dict.Index
  if (!Array.isArray(index)) index = [0, size]

  let data = decodeStream({ dict: obj.dict, data: obj.stream })
  if (!data) return null

  let entries = new Map()
  let entrySize = W[0] + W[1] + W[2]
  let pos = 0

  for (let g = 0; g < index.length; g += 2) {
    let first = index[g]
    let count = index[g + 1]

    for (let i = 0; i < count; i++) {
      if (pos + entrySize > data.length) break

      let type = W[0] === 0 ? 1 : readUint(data, pos, W[0])
      let f2 = readUint(data, pos + W[0], W[1])
      let f3 = readUint(data, pos + W[0] + W[1], W[2])
      pos += entrySize

      let num = first + i
      if (type === 1) {
        entries.set(num, { type: 1, offset: f2, gen: f3 })
      } else if (type === 2) {
        entries.set(num, { type: 2, objStm: f2, idx: f3 })
      }
    }
  }

  return { entries, trailer: obj.dict }
}

function readUint (buf, offset, width) {
  let v = 0
  for (let i = 0; i < width; i++) {
    v = (v * 256) + buf[offset + i]
  }
  return v
}

function resolveObject (buffer, xref, ref) {
  if (!ref || ref.kind !== 'ref') return null
  let entry = xref.entries.get(ref.num)
  if (!entry) return null

  if (entry.type === 1) {
    return readObjectAt(buffer, entry.offset)
  }
  if (entry.type === 2) {
    return readFromObjectStream(buffer, xref, entry.objStm, entry.idx)
  }
  return null
}

function resolveRef (buffer, xref, value) {
  if (value == null) return null
  if (value?.kind === 'ref') return resolveObject(buffer, xref, value)
  if (typeof value === 'object') return { dict: value }
  return { value }
}

function readObjectAt (buffer, offset) {
  // Read header: "<num> <gen> obj"
  let headStr = buffer.slice(offset, offset + 64).toString('latin1')
  let m = /^\s*(\d+)\s+(\d+)\s+obj\s*/.exec(headStr)
  if (!m) return null

  let bodyStart = offset + m[0].length
  let bodyStr = buffer.slice(bodyStart, Math.min(buffer.length, bodyStart + 65536))
    .toString('latin1')

  let dict = null
  let valueEnd = 0

  if (bodyStr.startsWith('<<')) {
    let parsed = parseDict(bodyStr, 0)
    dict = parsed.dict
    valueEnd = parsed.end
  } else {
    // Non-dict value (array, number, etc.) — unlikely for our needs
    let endIdx = bodyStr.indexOf('endobj')
    if (endIdx < 0) return null
    let raw = bodyStr.slice(0, endIdx).trim()
    return { dict: null, value: parseValue(raw, 0).value }
  }

  // Check for stream
  let afterDict = bodyStr.slice(valueEnd)
  let sm = /^\s*stream(\r\n|\n)/.exec(afterDict)

  if (sm) {
    let streamOffset = bodyStart + valueEnd + sm[0].length
    let length = dict?.Length
    if (typeof length !== 'number') {
      // Try to find endstream directly
      let ends = findEndstream(buffer, streamOffset)
      if (ends == null) return { dict }
      return { dict, stream: buffer.slice(streamOffset, ends) }
    }
    return { dict, stream: buffer.slice(streamOffset, streamOffset + length) }
  }

  return { dict }
}

function findEndstream (buffer, from) {
  let search = buffer.slice(from, Math.min(buffer.length, from + 50 * 1024 * 1024))
  let s = search.toString('latin1')
  let idx = s.indexOf('endstream')
  if (idx < 0) return null
  // Trim trailing CR/LF
  let end = from + idx
  if (buffer[end - 1] === 0x0A) end--
  if (buffer[end - 1] === 0x0D) end--
  return end
}

function readFromObjectStream (buffer, xref, objStmNum, idx) {
  let entry = xref.entries.get(objStmNum)
  if (!entry || entry.type !== 1) return null

  let obj = readObjectAt(buffer, entry.offset)
  if (!obj?.dict || !obj.stream) return null

  let data = decodeStream({ dict: obj.dict, data: obj.stream })
  if (!data) return null

  let n = obj.dict.N
  let first = obj.dict.First
  if (typeof n !== 'number' || typeof first !== 'number') return null

  let header = data.slice(0, first).toString('latin1')
  let pairs = header.trim().split(/\s+/).map(Number)

  if (idx * 2 + 1 >= pairs.length) return null
  let objOffset = first + pairs[idx * 2 + 1]
  let body = data.slice(objOffset).toString('latin1')

  if (body.startsWith('<<')) {
    let { dict } = parseDict(body, 0)
    return { dict }
  }
  let parsed = parseValue(body, 0)
  return { dict: null, value: parsed.value }
}

function decodeStream ({ dict, data }) {
  if (!data) return null
  let filter = dict?.Filter
  if (!filter) return Buffer.from(data)

  let filters = Array.isArray(filter) ? filter : [filter]
  let result = Buffer.from(data)

  for (let f of filters) {
    let name = typeof f === 'string' ? f : f?.name
    if (name === 'FlateDecode' || name === 'Fl') {
      try {
        result = zlib.inflateSync(result)
      } catch {
        return null
      }
    } else {
      // Unsupported filter
      return null
    }
  }

  // Apply DecodeParms Predictor if present (FlateDecode with PNG predictor)
  let parms = dict?.DecodeParms
  if (parms && !Array.isArray(parms)) {
    let predictor = parms.Predictor
    if (predictor && predictor >= 10) {
      result = applyPngPredictor(result, parms.Columns || 1, parms.Colors || 1,
        parms.BitsPerComponent || 8)
      if (!result) return null
    }
  }

  return result
}

function applyPngPredictor (data, columns, colors, bits) {
  let bytesPerPixel = Math.max(1, Math.ceil((colors * bits) / 8))
  let rowLen = Math.ceil((columns * colors * bits) / 8)
  let stride = rowLen + 1
  let rows = Math.floor(data.length / stride)
  let out = Buffer.alloc(rows * rowLen)
  let prev = Buffer.alloc(rowLen)

  for (let r = 0; r < rows; r++) {
    let filterType = data[r * stride]
    let row = data.slice(r * stride + 1, r * stride + 1 + rowLen)
    let decoded = Buffer.alloc(rowLen)

    for (let c = 0; c < rowLen; c++) {
      let left = c >= bytesPerPixel ? decoded[c - bytesPerPixel] : 0
      let up = prev[c]
      let upLeft = c >= bytesPerPixel ? prev[c - bytesPerPixel] : 0

      switch (filterType) {
        case 0: decoded[c] = row[c]; break
        case 1: decoded[c] = (row[c] + left) & 0xff; break
        case 2: decoded[c] = (row[c] + up) & 0xff; break
        case 3: decoded[c] = (row[c] + Math.floor((left + up) / 2)) & 0xff; break
        case 4: {
          let p = left + up - upLeft
          let pa = Math.abs(p - left)
          let pb = Math.abs(p - up)
          let pc = Math.abs(p - upLeft)
          let pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
          decoded[c] = (row[c] + pr) & 0xff
          break
        }
        default: return null
      }
    }

    decoded.copy(out, r * rowLen)
    prev = decoded
  }

  return out
}

function walkNameTree (buffer, xref, nodeRef, out) {
  let node = resolveRef(buffer, xref, nodeRef)
  if (!node?.dict) return

  if (node.dict.Names) {
    let names = resolveArrayValue(buffer, xref, node.dict.Names)
    for (let i = 0; i < names.length; i += 2) {
      out.push({ name: names[i], value: names[i + 1] })
    }
  }

  if (node.dict.Kids) {
    let kids = resolveArrayValue(buffer, xref, node.dict.Kids)
    for (let kid of kids) {
      walkNameTree(buffer, xref, kid, out)
    }
  }
}

function resolveArrayValue (buffer, xref, value) {
  if (Array.isArray(value)) return value
  if (value?.kind === 'ref') {
    let obj = resolveObject(buffer, xref, value)
    if (Array.isArray(obj?.value)) return obj.value
    if (Array.isArray(obj?.dict)) return obj.dict
  }
  return []
}

// --- PDF value / dictionary parser --- //

function parseDict (str, start) {
  // Expects str[start..] starts with "<<"
  let i = start + 2
  let dict = {}

  while (i < str.length) {
    i = skipWs(str, i)
    if (str[i] === '>' && str[i + 1] === '>') {
      return { dict, end: i + 2 }
    }
    if (str[i] !== '/') {
      // Malformed — bail
      return { dict, end: i }
    }
    let nameRes = parseName(str, i)
    i = nameRes.end
    i = skipWs(str, i)

    let valRes = parseValue(str, i)
    dict[nameRes.name] = valRes.value
    i = valRes.end
  }

  return { dict, end: i }
}

function parseArray (str, start) {
  let i = start + 1
  let arr = []
  while (i < str.length) {
    i = skipWs(str, i)
    if (str[i] === ']') return { value: arr, end: i + 1 }
    let v = parseValue(str, i)
    arr.push(v.value)
    i = v.end
  }
  return { value: arr, end: i }
}

function parseValue (str, start) {
  let i = skipWs(str, start)
  let c = str[i]

  if (c === '<' && str[i + 1] === '<') {
    let r = parseDict(str, i)
    return { value: r.dict, end: r.end }
  }
  if (c === '<') {
    // Hex string
    let end = str.indexOf('>', i + 1)
    if (end < 0) return { value: null, end: i + 1 }
    return { value: hexStringToBuffer(str.slice(i + 1, end)), end: end + 1 }
  }
  if (c === '[') {
    return parseArray(str, i)
  }
  if (c === '/') {
    let r = parseName(str, i)
    return { value: r.name, end: r.end }
  }
  if (c === '(') {
    return parseLiteralString(str, i)
  }
  if (c === 't' && str.startsWith('true', i)) {
    return { value: true, end: i + 4 }
  }
  if (c === 'f' && str.startsWith('false', i)) {
    return { value: false, end: i + 5 }
  }
  if (c === 'n' && str.startsWith('null', i)) {
    return { value: null, end: i + 4 }
  }

  // Number or indirect reference (e.g., "12 0 R")
  let m = /^(-?\d+(?:\.\d+)?)(\s+(-?\d+)\s+R)?/.exec(str.slice(i))
  if (m) {
    if (m[2]) {
      return {
        value: { kind: 'ref', num: parseInt(m[1], 10), gen: parseInt(m[3], 10) },
        end: i + m[0].length
      }
    }
    return { value: parseFloat(m[1]), end: i + m[0].length }
  }

  return { value: null, end: i + 1 }
}

function parseName (str, start) {
  // str[start] === '/'
  let i = start + 1
  let out = ''
  while (i < str.length) {
    let c = str[i]
    if (WS.test(c) || '/<>[]()'.includes(c)) break
    if (c === '#') {
      out += String.fromCharCode(parseInt(str.slice(i + 1, i + 3), 16))
      i += 3
    } else {
      out += c
      i++
    }
  }
  return { name: out, end: i }
}

function parseLiteralString (str, start) {
  // str[start] === '('
  let i = start + 1
  let depth = 1
  let out = ''
  while (i < str.length && depth > 0) {
    let c = str[i]
    if (c === '\\') {
      let nxt = str[i + 1]
      switch (nxt) {
        case 'n': out += '\n'; i += 2; break
        case 'r': out += '\r'; i += 2; break
        case 't': out += '\t'; i += 2; break
        case 'b': out += '\b'; i += 2; break
        case 'f': out += '\f'; i += 2; break
        case '(': out += '('; i += 2; break
        case ')': out += ')'; i += 2; break
        case '\\': out += '\\'; i += 2; break
        default:
          if (/[0-7]/.test(nxt)) {
            let m = /^[0-7]{1,3}/.exec(str.slice(i + 1))[0]
            out += String.fromCharCode(parseInt(m, 8))
            i += 1 + m.length
          } else {
            i += 2
          }
      }
    } else if (c === '(') {
      depth++
      out += c
      i++
    } else if (c === ')') {
      depth--
      if (depth === 0) break
      out += c
      i++
    } else {
      out += c
      i++
    }
  }
  return { value: out, end: i + 1 }
}

function hexStringToBuffer (hex) {
  let clean = hex.replace(/\s+/g, '')
  if (clean.length % 2) clean += '0'
  let out = Buffer.alloc(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function skipWs (str, i) {
  while (i < str.length) {
    let c = str[i]
    if (WS.test(c)) { i++; continue }
    if (c === '%') {
      // Comment — skip to end of line
      while (i < str.length && str[i] !== '\n' && str[i] !== '\r') i++
      continue
    }
    break
  }
  return i
}
