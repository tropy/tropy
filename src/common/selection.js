import { indexOf } from './sequence.js'
import { own } from './util.js'

const toId = (it) => it?.id ?? it

// Maps the ids of elements (or ids) to true.
const toMap = (elements = []) => {
  let map = Object.create(null)
  for (let it of elements) map[toId(it)] = true
  return map
}

// Selection state of a sequence:
//   - selected: maps (numeric!) id -> true
//   - anchor: id where current range starts
//   - cursor: id of current position in sequence
//
// Selection state is plain and may live in Redux.
// Selection class is a thin wrapper on top of it.

export const create = (ids = [], {
  anchor = toId(ids.at(-1)) ?? null,
  cursor = anchor
} = {}) => ({
  selected: toMap(ids),
  anchor,
  cursor
})

const copy = (map) =>
  Object.assign(Object.create(null), map)

// Accepts an element or an id.
export const has = (state, it) =>
  own(state.selected, toId(it))

export const size = (state) =>
  Object.keys(state.selected).length

export const equal = (a, b) => {
  if (a === b)
    return true
  if (a.anchor !== b.anchor || a.cursor !== b.cursor)
    return false

  for (let id in a.selected)
    if (!own(b.selected, id)) return false

  for (let id in b.selected)
    if (!own(a.selected, id)) return false

  return true
}

// NB: selections have no inherent order!
// Because we use numeric keys in a plain object,
// they may get returned sorted by value or in insertion order.
//
// Returns selected ids, in no particular order.
export const ids = (state) =>
  Object.keys(state.selected).map(Number)

// Returns the selected elements of seq, in sequence order.
const effective = (state, seq) =>
  seq.filter(it => has(state, it))

export { effective as elements }

// NB: Multi-selections are inherently unorderd,
// but sometimes we need a representative element.
// By default this 'primary' element is the cursor (if selected),
// and otherwise the first selected element
//
// Primary element is used, e.g., as the merge target when merging items.

// Returns the primary element, or null.
export const primary = (state, seq) => {
  let index = indexOf(seq, state.cursor)

  return (index >= 0 && has(state, state.cursor)) ?
    seq[index] :
    seq.find(it => has(state, it)) ?? null
}

// Selects `id` with `mode` and returns new state, or `state` if unchanged.
export function select (state, seq, id, { mode = 'replace' } = {}) {
  if (mode === 'clear')
    return clear(state)

  let at = indexOf(seq, id)

  if (at < 0)
    return state

  let next = change(state, seq, id, at, mode)
  return equal(state, next) ? state : next
}

const change = (state, seq, id, at, mode) => {
  switch (mode) {
    case 'replace':
      return {
        selected: toMap([id]),
        anchor: id,
        cursor: id
      }

    case 'toggle': {
      let selected = copy(state.selected)
      toggle(selected, id)

      return {
        selected,
        anchor: id,
        cursor: id
      }
    }

    case 'extend': {
      let { anchor, prev, next } = ranges(state, seq, id, at)
      let selected = copy(state.selected)

      if (prev) {
        each(seq, prev, (it) => { delete selected[it] })
      }

      each(seq, next, (it) => { selected[it] = true })

      return {
        selected,
        anchor,
        cursor: id
      }
    }

    case 'flip': {
      let { anchor, prev, next } = ranges(state, seq, id, at)
      let selected = copy(state.selected)

      if (prev) {
        each(seq, prev, (it) => toggle(selected, it))
      }

      each(seq, next, (it) => toggle(selected, it))

      return {
        selected,
        anchor,
        cursor: id
      }
    }

    // Keyboard steps in grids, as in macOS Finder:
    // add the range from the cursor to id, or,
    // if fully selected (moving back), removed except for id.
    // Anchor and cursor always move to id.
    case 'step': {
      let c = indexOf(seq, state.cursor)
      let range = [(c < 0) ? at : c, at]
      let selected = copy(state.selected)
      let isSelected = true

      each(seq, range, (it) => {
        if (!own(selected, it)) isSelected = false
      })

      if (isSelected) {
        each(seq, range, (it) => {
          if (it !== id) delete selected[it]
        })
      } else {
        each(seq, range, (it) => { selected[it] = true })
      }

      return {
        selected,
        anchor: id,
        cursor: id
      }
    }

    default:
      throw new Error(`unknown selection mode: "${mode}"`)
  }
}

// Returns new state with all elements of seq selected, or `state` if unchanged.
export const all = (state, seq) =>
  (seq.every(it => has(state, it)) && size(state) === seq.length)
    ? state
    : { ...state, selected: toMap(seq) }

// Returns new state with nothing selected, or `state` if unchanged.
export const clear = (state) => {
  let next = { ...state, selected: toMap() }
  return equal(state, next) ? state : next
}

// Applies fn to the ids of seq between positions a and b, inclusive.
const each = (seq, [a, b], fn) => {
  for (let i = Math.min(a, b), j = Math.max(a, b); i <= j; ++i)
    fn(toId(seq[i]))
}

// Returns the anchor and prev/next ranges (positions).
const ranges = ({ anchor, cursor }, seq, id, at) => {
  let a = indexOf(seq, anchor)

  // With no visible anchor, next starts at the new position
  if (a < 0)
    return {
      anchor: id, prev: null, next: [at, at]
    }

  // Next range is from old anchor to the new position
  let next = [a, at]
  let c = indexOf(seq, cursor)

  // With no visible cursor, prev is just the old anchor
  if (c < 0)
    return { anchor, prev: [a, a], next }
  else
    return { anchor, prev: [a, c], next }
}

const toggle = (selected, id) => {
  if (own(selected, id))
    delete selected[id]
  else
    selected[id] = true
}

// A Selection is an immutable wrapper
// for a selection state and a sequence.
export class Selection {
  #elements
  #primary
  #ids
  #size

  static is (selection) {
    return selection instanceof Selection || selection?.selected != null
  }

  static from (selection, seq) {
    if (selection instanceof Selection)
      return selection

    let state = Selection.is(selection)
      ? selection
      : create(selection == null ? [] : [toId(selection)])

    return new Selection(state, seq)
  }

  constructor (state, seq) {
    this.state = state
    this.seq = seq
    Object.freeze(this)
  }

  get anchor () {
    return this.state.anchor
  }

  get cursor () {
    return this.state.cursor
  }

  get size () {
    return (this.#size ??= size(this.state))
  }

  has (id) {
    return has(this.state, id)
  }

  // All selected ids, with the primary one first, for easy access.
  ids () {
    if (this.#ids === undefined) {
      let first = toId(this.primary())
      let rest = ids(this.state)

      this.#ids = Object.freeze((first == null) ?
        rest :
        [first, ...rest.filter(id => id !== first)])
    }

    return this.#ids
  }

  elements () {
    return (this.#elements ??= Object.freeze(effective(this.state, this.seq)))
  }

  primary () {
    if (this.#primary === undefined)
      this.#primary = primary(this.state, this.seq)

    return this.#primary
  }

  select (id, options) {
    return select(this.state, this.seq, id, options)
  }

  all () {
    return all(this.state, this.seq)
  }

  clear () {
    return clear(this.state)
  }
}

// Returns the edge of the range which has grown,
// compared to the previous range:
// -1 for head, 1 for tail, 0 for neither or both.
export function growingEdge ([head, tail] = [], [prevHead, prevTail] = []) {
  if (head == null) return 0
  if (prevHead == null) return 1

  return (tail > prevTail ? 1 : 0) - (head < prevHead ? 1 : 0)
}
