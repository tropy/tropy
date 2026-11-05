import { stable } from './sequence.js'

/*
 * Orders sequences of ids by key.
 *
 * Ids are a set: each id at most once.
 *
 * Results are plain arrays:
 * callers index or freeze them if needed,
 * so sorting can be split from indexing (yield, cancel)
 * and results can cross a worker boundary.
 */

const isEmpty = (key) =>
  key == null || key === '' || Number.isNaN(key)

const natural = (a, b) =>
  (a < b) ? -1 : (a > b) ? 1 : 0

const comparator = (key, { compare = natural, asc = true } = {}) => {
  let dir = asc ? 1 : -1

  return (a, b) => {
    let ka = key(a)
    let kb = key(b)
    let ea = isEmpty(ka)
    let eb = isEmpty(kb)

    if (ea || eb)
      return (ea && eb) ? dir * natural(a, b) : (ea ? 1 : -1)

    return dir * (compare(ka, kb) || natural(a, b))
  }
}

// Sorts ids by key.
//
// NB: this is fast if ids are nearly sorted already:
// pass a previous order, a seed order from the database,
// or the ids in presort order.
export function build (ids, key, { compare = natural, asc = true } = {}) {
  let full = []
  let empty = []

  for (let id of ids) {
    let k = key(id)
    if (isEmpty(k)) empty.push(id)
    else full.push([k, id])
  }

  let dir = asc ? 1 : -1

  // Sorting [key, id] pairs avoids a key lookup per comparison.
  full.sort((a, b) => dir * (compare(a[0], b[0]) || natural(a[1], b[1])))
  empty.sort((a, b) => dir * natural(a, b))

  let seq = []

  for (let pair of full) seq.push(pair[1])
  for (let id of empty) seq.push(id)

  return seq
}

// Returns seq, built by key, in the opposite direction:
// the keyed ids reversed, then the empty ones reversed (still last).
// Same as a build with the other direction, ties by id included.
export function reverse (seq, key) {
  let n = seq.length
  while (n > 0 && isEmpty(key(seq[n - 1]))) --n

  let res = []

  for (let i = n - 1; i >= 0; --i) res.push(seq[i])
  for (let i = seq.length - 1; i >= n; --i) res.push(seq[i])

  return res
}

// Pads digit runs, so that binary order approximates numeric order.
const fold = (key) =>
  String(key).toLowerCase().replace(/\d+/g, d => d.padStart(16, '0'))

// Returns ids in an order close to a case-insensitive,
// numeric collation of their keys, using only cheap binary comparisons.
export function presort (ids, key) {
  let pairs = []

  for (let id of ids) {
    let k = key(id)
    pairs.push([isEmpty(k) ? '' : fold(k), id])
  }

  pairs.sort((a, b) => natural(a[0], b[0]))

  return pairs.map(pair => pair[1])
}

// Returns seq with changed ids (new keys, or not in seq yet)
// moved into place and removed ids dropped;
// every other id keeps its position relative to the others.
// Seq must be ordered by the same key and options.
export function update (seq, { changed = [], removed = [] }, key, options) {
  if (changed.length === 0 && removed.length === 0)
    return seq

  let cmp = comparator(key, options)
  let gone = new Set(removed)
  let moves = [...new Set(changed)].filter(id => !gone.has(id)).sort(cmp)

  for (let id of moves) gone.add(id)

  // An indexed loop: filter is slow on frozen arrays (from state).
  let rest = []
  for (let i = 0; i < seq.length; ++i)
    if (!gone.has(seq[i])) rest.push(seq[i])

  let res = []
  let pos = 0

  for (let id of moves) {
    // Moves are sorted, so each one goes at or after the previous one.
    let lo = pos
    let hi = rest.length

    while (lo < hi) {
      let mid = (lo + hi) >>> 1
      if (cmp(rest[mid], id) < 0) lo = mid + 1
      else hi = mid
    }

    while (pos < lo) res.push(rest[pos++])
    res.push(id)
  }

  while (pos < rest.length) res.push(rest[pos++])

  return stable(res, seq)
}
