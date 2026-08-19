export function select (s, items, mod = 'replace') {
  switch (mod) {
    case 'replace':
      return replace(s, items)
    case 'remove':
      return remove(s, items)
    case 'subtract':
      return subtract(s, items)
    case 'append':
      return append(s, items)
    case 'merge':
      return merge(s, items)
    case 'clear':
      return clear(s, items)
    default:
      throw new Error(`unknown selection mode: "${mod}"`)

  }
}

export function clear () {
  return []
}

export function replace (_, items) {
  return [...items]
}

export function remove (s, items) {
  return s.filter(it => !items.includes(it))
}

export function subtract (s, [head, ...items]) {
  return [...s.filter(it => it !== head && !items.includes(it)), head]
}

export function append (s, items) {
  return [...s, ...items]
}

export function merge (s, items) {
  return [...remove(s, items), ...items]
}

export function isSelected (s, items) {
  return Array.isArray(items) ?
    items.find(it => s.includes(it)) :
    s.includes(items)
}

// Returns the edge of the range which has grown,
// compared to the previous range:
// -1 for head, 1 for tail, 0 for neither or both.
export function growingEdge ([head, tail] = [], [prevHead, prevTail] = []) {
  if (head == null) return 0
  if (prevHead == null) return 1

  return (tail > prevTail ? 1 : 0) - (head < prevHead ? 1 : 0)
}
