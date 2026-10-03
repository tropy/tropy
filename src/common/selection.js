import { indexOf, matches, range } from './sequence.js'

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

// Returns the elements of `seq` and the selection mode for selecting
// `id`, or null if the selection would not change or `id` is not in
// `seq`. Ranges extend from the selection's head (its last id) or,
// without a selection, from the start; `id` becomes the new head. If
// the head is not in `seq`, only `id` is selected.
export function getSelectionChange (selection, seq, id, {
  isMeta,
  isRange
} = {}) {
  let element = seq[indexOf(seq, id)]

  if (element == null)
    return null

  let isSelected = (it) => selection.some(s => matches(it, s))

  if (isRange) {
    let head = selection.at(-1)

    if (head != null && indexOf(seq, head) < 0)
      return [[element], 'replace']

    let elements = range(seq, head, id)

    if (!elements.every(isSelected))
      return [elements, 'merge']

    // Subtract keeps the first element selected as the new head.
    if (elements[0] !== element) elements.unshift(elements.pop())
    return [elements, 'subtract']
  }

  if (isMeta)
    return [[element], isSelected(element) ? 'remove' : 'append']

  if (selection.length === 1 && matches(element, selection[0]))
    return null

  return [[element], 'replace']
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
