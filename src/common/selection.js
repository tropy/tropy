import { indexOf, toId } from './sequence.js'

// Maps the ids of elements (or ids) to true.
const toMap = (elements = []) => {
  let map = Object.create(null)
  for (let it of elements) map[toId(it)] = true
  return map
}

/*
 * Selection state of a sequence:
 *   - selected: maps (numeric!) id -> true
 *   - anchor: id where current range starts
 *   - cursor: id of current position in sequence
 *
 * Selection state is plain and may live in Redux.
 * Selection class is a thin wrapper on top of it.
 */

export const create = (ids = [], {
  anchor = toId(ids.at(-1)) ?? null,
  cursor = anchor
} = {}) => ({
  selected: toMap(ids),
  anchor,
  cursor
})

export const isSelection = (state) =>
  typeof state?.selected === 'object' && state.selected !== null

export const from = (input) =>
  isSelection(input)
    ? input
    : create((input == null) ? [] : [input].flat())

const copy = (map) =>
  Object.assign(Object.create(null), map)

// Accepts an element or an id.
export const has = (state, it) =>
  Object.hasOwn(state.selected, toId(it))

export const size = (state) =>
  Object.keys(state.selected).length

export const isBlank = (...states) =>
  states.every(state =>
    state.cursor == null && state.anchor == null && size(state) === 0)

export const equal = (a, b) => {
  if (a === b)
    return true
  if (a.anchor !== b.anchor || a.cursor !== b.cursor)
    return false

  for (let id in a.selected)
    if (!Object.hasOwn(b.selected, id)) return false

  for (let id in b.selected)
    if (!Object.hasOwn(a.selected, id)) return false

  return true
}

// NB: selections have no inherent order!
// Because we use numeric keys in a plain object,
// they may get returned sorted by value or in insertion order.
//
// Returns selected ids, in no particular order.
export const ids = (state) => {
  let res = []
  for (let id in state.selected)
    res.push(Number(id))

  return res
}

// Returns the selected elements of seq, in sequence order.
const effective = (state, seq) => {
  // For big selections we filter the full sequence.
  if (size(state) * 16 >= seq.length)
    return seq.filter(it => has(state, it))

  // For small selections we lookup and sort the selected elemnts.
  let positions = []

  for (let id in state.selected) {
    let at = indexOf(seq, Number(id))
    if (at >= 0) positions.push(at)
  }

  return positions
    .sort((a, b) => a - b)
    .map(at => seq[at])
}

export { effective as elements }

// NB: Multi-selections are inherently unordered,
// but sometimes we need a representative id.
// This 'primary' id is the cursor (if selected),
// and otherwise the first selected id (the lowest).
// It depends on the selection state only, not on a sequence.

// Returns the primary id, or null.
export const primary = (state) => {
  if (has(state, state.cursor))
    return state.cursor

  for (let id in state.selected)
    return Number(id)

  return null
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
        if (!Object.hasOwn(selected, it)) isSelected = false
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
    case 'focus':
      return focus(state, id)
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

// Moves cursor/anchor within the selection if possible.
export const focus = (state, id) => {
  if (id == null)
    return isBlank(state) ? state : create()
  if (!has(state, id))
    return create([id])
  if (state.anchor === id && state.cursor === id)
    return state
  else
    return { ...state, anchor: id, cursor: id }
}

// Returns new state without given elements, or `state` if unchanged.
export const remove = (state, elements) => {
  let { selected, anchor, cursor } = state

  for (let it of elements) {
    let id = toId(it)

    if (Object.hasOwn(selected, id)) {
      if (selected === state.selected)
        selected = copy(selected)

      delete selected[id]
    }

    if (id === anchor) anchor = null
    if (id === cursor) cursor = null
  }

  return (
    selected === state.selected &&
    anchor === state.anchor &&
    cursor === state.cursor
  ) ? state : { ...state, selected, anchor, cursor }
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
  if (Object.hasOwn(selected, id))
    delete selected[id]
  else
    selected[id] = true
}

// A Selection is an immutable wrapper
// for a selection state and a sequence.
export class Selection {
  #elements
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

  ids () {
    return (this.#ids ??= Object.freeze(ids(this.state)))
  }

  elements () {
    return (
      this.#elements ??= Object.freeze(effective(this.state, this.seq))
    )
  }

  primary () {
    return primary(this.state)
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
