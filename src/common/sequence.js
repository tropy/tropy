// Sequence elements match either by identity or via `id` property.
export const matches = (it, id) => it === id || it.id === id

export const indexOf = (seq, id) => {
  if (id == null)
    return -1
  else
    return (seq.idx != null)
      ? seq.idx[id] ?? -1
      : seq.findIndex(it => matches(it, id))
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

// Seek element by following nav `cmd` from `id` element.
export const seek = (seq, id, cmd, options) =>
  seekFrom(seq, indexOf(seq, id), cmd, options)

const seekFrom = (seq, index, cmd, options) => {
  let { length } = seq

  if (length === 0)
    return null

  index = (index < 0) ?
    getFirstIndex(length, cmd) :
    getNextIndex(length, index, cmd, options)

  return (index == null) ? null : seq[index]
}

const getFirstIndex = (length, cmd) => {
  switch (cmd) {
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
      throw new Error(`unknown seek command: "${cmd}"`)
  }
}

const getNextIndex = (length, index, cmd, {
  columns = 1,
  pageSize = 1,
  restrict = 'bounds'
} = {}) => {
  if (columns === 1) {
    if (cmd === 'up') cmd = 'prev'
    if (cmd === 'down') cmd = 'next'
  }

  let col = index % columns

  switch (cmd) {
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
      throw new Error(`unknown seek command: "${cmd}"`)
  }
}

export class Cursor {
  #index

  constructor (seq, id, options) {
    this.seq = seq
    this.id = id
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

  // Returns the previous and next elements in the sequence.
  adjacent () {
    let { index, seq } = this

    if (index < 0)
      return [null, null]

    return [seq[index - 1] ?? null, seq[index + 1] ?? null]
  }

  seek (cmd, options) {
    return seekFrom(this.seq, this.index, cmd, { ...this.options, ...options })
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
