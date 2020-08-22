export function select(s, items, mod = 'replace') {
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
    default:
      throw new Error(`unknown selection mode: "${mod}"`)

  }
}

export function clear() {
  return []
}

export function replace(_, items) {
  return [...items]
}

export function remove(s, items) {
  return s.filter(it => !items.includes(it))
}

export function subtract(s, [head, ...items]) {
  return [...s.filter(it => it !== head && !items.includes(it)), head]
}

export function append(s, items) {
  return [...s, ...items]
}

export function merge(s, items) {
  return [...Selection.remove(s, items), ...items]
}

export function isSelected(s, items) {
  return Array.isArray(items) ?
    items.find(it => s.includes(it)) :
    s.includes(items)
}
