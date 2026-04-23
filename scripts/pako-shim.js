// Stand-in for `pako` when bundling pdf-lib. Node's zlib matches pako's
// call signature (Uint8Array in, Uint8Array out), so the swap is transparent.
// pdf-lib's read path is covered by its own FlateStream port — this shim only
// gets invoked on the (rarely-reached) write path and by the bundled standard
// font decompressor.
import { deflateSync, inflateSync } from 'node:zlib'

function toZlibOptions (opts) {
  if (!opts || typeof opts !== 'object') return undefined
  let out = {}
  if (opts.level != null) out.level = opts.level
  if (opts.windowBits != null) out.windowBits = opts.windowBits
  if (opts.memLevel != null) out.memLevel = opts.memLevel
  if (opts.strategy != null) out.strategy = opts.strategy
  if (opts.dictionary != null) out.dictionary = opts.dictionary
  return out
}

export function deflate (input, opts) {
  return new Uint8Array(deflateSync(input, toZlibOptions(opts)))
}

export function inflate (input, opts) {
  return new Uint8Array(inflateSync(input, toZlibOptions(opts)))
}

export default { deflate, inflate }
