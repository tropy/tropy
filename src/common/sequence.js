/*
 * Sequences are plain arrays.
 * Potentially stored in Redux state!
 * Each element of a sequence is either an `id` or of form `{ id }`;
 * elements without an id match by identity (see `toId`).
 *
 * Arrays registered by `createSequence` are indexed on demand,
 * on their first lookup, to make `indexOf` O(1).
 *
 * Registered sequences may only be appended to
 * (the index catches up on the next lookup)
 * and their ids must be unique.
 */

const IDX = new WeakMap()

// Arrays below this size are never indexed!
const MIN_SIZE = 32

// Returns the element's identifier.
export const toId = (element) =>
  element?.id ?? element

// Registers seq (by default a new array) as a sequence and returns it.
export const createSequence = (seq = []) => (
  IDX.set(seq, true), seq
)

const getIndex = (seq) => {
  let idx = IDX.get(seq)

  if (!idx || seq.length < MIN_SIZE)
    return null
  if (idx === true) {
    idx = new Map()
    IDX.set(seq, idx)
  }

  // Update index as necessary!
  for (let i = idx.size; i < seq.length; ++i)
    idx.set(toId(seq[i]), i)

  return idx
}

// Whether a and b have the same elements in the same order.
export const isSameSequence = (a, b) => {
  if (a === b)
    return true
  if (a == null || b == null || a.length !== b.length)
    return false

  for (let i = 0; i < a.length; ++i)
    if (a[i] !== b[i]) return false

  return true
}

// Also exported for selectors memoizeOptions
export { isSameSequence as resultEqualityCheck }

// Returns prev if seq has the same elements in the same order,
// so that unchanged sequences keep their identity.
export const stable = (seq, prev) =>
  isSameSequence(seq, prev) ? prev : seq

// Sequence elements match by id (see toId).
// NB: Uses the index for registered sequences!
export const indexOf = (seq, element) => {
  if (element == null)
    return -1

  let id = toId(element)
  let idx = getIndex(seq)

  if (idx != null)
    return idx.get(id) ?? -1

  for (let i = 0; i < seq.length; ++i)
    if (toId(seq[i]) === id) return i

  return -1
}

// Returns all elements `from` `to` inclusive, in order.
// Missing anchors default to start/end of sequence.
export const range = (seq, from, to) => {
  from = indexOf(seq, from)
  to = indexOf(seq, to)

  if (from < 0) from = 0
  if (to < 0) to = seq.length - 1

  return (from > to) ?
    seq.slice(to, from + 1).reverse() :
    seq.slice(from, to + 1)
}

export const sanitize = (length, index, restrict = 'bounds') => {
  if (index >= 0 && index < length)
    return index
  switch (restrict) {
    case 'wrap':
      index = index % length
      return (index < 0) ? index + length : index
    case 'bounds':
      return (index < 0) ? 0 : length - 1
    default:
      return null
  }
}

// Returns the previous and next of element.
export const adjacent = (seq, element) =>
  adjacentAt(seq, indexOf(seq, element))

const adjacentAt = (seq, index) =>
  (index < 0) ?
    [null, null] :
    [seq[index - 1] ?? null, seq[index + 1] ?? null]

// Seek by following the `move` from the element.
export const seek = (seq, element, move, options) =>
  seekFrom(seq, indexOf(seq, element), move, options)

const seekFrom = (seq, index, move, options) => {
  let { length } = seq

  if (length === 0)
    return null

  index = (index < 0) ?
    getFirstIndex(length, move) :
    getNextIndex(length, index, move, options)

  return (index == null) ? null : seq[index]
}

const getFirstIndex = (length, move) => {
  switch (move) {
    case 'next':
    case 'down':
    case 'end':
    case 'pageDown':
    case 'first':
      return 0
    case 'prev':
    case 'up':
    case 'start':
    case 'pageUp':
    case 'last':
      return length - 1
    default:
      throw new Error(`unknown move: "${move}"`)
  }
}

const getNextIndex = (length, index, move, {
  columns = 1,
  pageSize = 1,
  restrict = 'bounds'
} = {}) => {
  if (columns === 1) {
    if (move === 'up') move = 'prev'
    if (move === 'down') move = 'next'
  }

  let col = index % columns

  switch (move) {
    case 'next':
      return sanitize(length, index + 1, restrict)
    case 'prev':
      return sanitize(length, index - 1, restrict)
    case 'up':
      return (index < columns) ? index : index - columns
    case 'down':
      return (index - col + columns >= length) ?
        index :
        Math.min(index + columns, length - 1)
    case 'start':
      return index - col
    case 'end':
      return Math.min(index - col + columns - 1, length - 1)
    case 'first':
      return 0
    case 'last':
      return length - 1
    case 'pageUp':
      return Math.max(index - pageSize, 0)
    case 'pageDown':
      return Math.min(index + pageSize, length - 1)
    default:
      throw new Error(`unknown move: "${move}"`)
  }
}

export class Cursor {
  #index

  constructor (seq, element, options) {
    this.seq = seq
    this.id = toId(element)
    this.options = options
  }

  get index () {
    if (this.#index == null)
      this.#index = indexOf(this.seq, this.id)

    return this.#index
  }

  current () {
    return this.seq[this.index] ?? null
  }

  adjacent () {
    return adjacentAt(this.seq, this.index)
  }

  successor () {
    let [prev, next] = this.adjacent()
    return next ?? prev
  }

  seek (move, options) {
    return seekFrom(this.seq, this.index, move, { ...this.options, ...options })
  }

  next () { return this.seek('next') }
  prev () { return this.seek('prev') }
  up () { return this.seek('up') }
  down () { return this.seek('down') }
  start () { return this.seek('start') }
  end () { return this.seek('end') }
  first () { return this.seek('first') }
  last () { return this.seek('last') }
  pageUp () { return this.seek('pageUp') }
  pageDown () { return this.seek('pageDown') }
}
