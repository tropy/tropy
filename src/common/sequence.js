export const indexOf = (seq, id) =>
  (seq.idx != null)
    ? seq.idx[id] ?? -1
    : seq.findIndex(it => it === id || it.id === id)

export const sanitize = (len, index, restrict = 'bounds') => {
  if (index >= 0 && index < len)
    return index

  switch (restrict) {
    case 'wrap':
      index = index % len
      return (index < 0) ? index + len : index

    case 'bounds':
      return (index < 0) ? 0 : len - 1

    default:
      return null
  }
}

// Returns the element of `seq` that a navigation command leads to
export const seek = (seq, cursor, cmd, options) => {
  let { length } = seq

  if (length === 0)
    return null

  let index = (cursor == null) ? -1 : indexOf(seq, cursor)

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
