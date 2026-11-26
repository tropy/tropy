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
 *   - past: past cursors still selected, most recent first
 *
 * Anchor and cursor may be deselected, past never is.
 *
 * Selection state is plain and may live in Redux.
 * Selection class is a thin wrapper on top of it,
 * which binds a selection to a sequence.
 */

export const create = (ids = [], {
  anchor = toId(ids.at(-1)) ?? null,
  cursor = anchor
} = {}) => {
  let selected = toMap(ids)

  return {
    selected,
    anchor,
    cursor,
    past: Object.hasOwn(selected, cursor) ? [cursor] : []
  }
}

const isSelectionState = (state) =>
  typeof state?.selected === 'object' && state.selected !== null

export const from = (input) =>
  (input instanceof Selection)
    ? input.state
    : isSelectionState(input)
      ? input
      : create((input == null) ? [] : [input].flat())

const copy = (map) =>
  Object.assign(Object.create(null), map)

// This is the handler for ALL state changes.
// Applies the requested changes and returns new state,
// or `state` if unchanged.
const update = (state, {
  selected = state.selected,
  anchor = state.anchor,
  cursor = state.cursor
}) => {
  let next = {
    ...state,
    selected,
    anchor,
    cursor
  }

  if (equal(state, next))
    return state

  next.past = remember(state.past, selected, cursor)
  return next
}

// Remembers past cursors (that are still selected).
const remember = (past = [], selected, cursor, max = 32) => {
  let next = []

  if (Object.hasOwn(selected, cursor))
    next.push(cursor)

  for (let pastCursor of past) {
    if (next.length >= max)
      break
    if (pastCursor !== cursor && Object.hasOwn(selected, pastCursor))
      next.push(pastCursor)
  }

  return next
}

// Whether an update changed anything observable.
// Ignores past cursors!
const equal = (a, b) => {
  if (a === b)
    return true
  if (a.anchor !== b.anchor || a.cursor !== b.cursor)
    return false
  if (a.selected === b.selected)
    return true

  // Object.keys is faster than for...in (no size to compare otherwise).
  let ids = Object.keys(a.selected)

  if (ids.length !== Object.keys(b.selected).length)
    return false

  for (let id of ids)
    if (!Object.hasOwn(b.selected, id)) return false

  return true
}

// Accepts an element or an id.
export const has = (state, it) =>
  Object.hasOwn(state.selected, toId(it))

export const size = (state) =>
  Object.keys(state.selected).length

export const isBlank = (...states) =>
  states.every(state =>
    state.cursor == null && state.anchor == null && size(state) === 0)

// NB: selections have no inherent order!
// Because we use numeric keys in a plain object,
// they may get returned sorted by value or in insertion order.
//
// Returns selected ids, in no particular order.
export const ids = (state) => {
  let res = Object.keys(state.selected)

  for (let i = 0; i < res.length; ++i)
    res[i] = Number(res[i])

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
// This 'head' id is the most recent cursor still selected,
// and falls back to the first selected id otherwise.
// It depends on the selection state only, not on a sequence.

// Returns the head id, or null.
export const head = (state) => {
  if (has(state, state.cursor))
    return state.cursor

  if (state.past) {
    for (let id of state.past)
      if (has(state, id)) return id
  }

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

  return update(state, change(state, seq, id, at, mode))
}

// Returns the changes of selecting `id` (at position `at`) with `mode`.
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
      return focusChange(state, id)
    default:
      throw new Error(`unknown selection mode: "${mode}"`)
  }
}

// Returns new state with all elements of seq selected,
// or `state` if unchanged.
export const all = (state, seq) => {
  let first = toId(seq[0]) ?? null
  let keepCursor = indexOf(seq, state.cursor) >= 0

  return update(state, {
    selected: toMap(seq),
    anchor: keepCursor ? state.anchor : first,
    cursor: keepCursor ? state.cursor : first
  })
}

// Returns new state with nothing selected, or `state` if unchanged.
export const clear = (state) =>
  update(state, { selected: toMap() })

// Moves cursor/anchor within the selection if possible.
export const focus = (state, id) =>
  update(state, focusChange(state, id))

// Returns the changes of focusing `id`.
const focusChange = (state, id) => {
  if (id == null)
    return { selected: toMap(), anchor: null, cursor: null }
  if (!has(state, id))
    return { selected: toMap([id]), anchor: id, cursor: id }
  else
    return { anchor: id, cursor: id }
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

  return update(state, { selected, anchor, cursor })
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
    return selection instanceof Selection || isSelectionState(selection)
  }

  static from (selection, seq) {
    if (selection instanceof Selection && selection.seq === seq)
      return selection

    return new Selection(from(selection), seq)
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

  head () {
    return head(this.state)
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
// -1 for start, 1 for end, 0 for neither or both.
export function growingEdge ([start, end] = [], [prevStart, prevEnd] = []) {
  if (start == null) return 0
  if (prevStart == null) return 1

  return (end > prevEnd ? 1 : 0) - (start < prevStart ? 1 : 0)
}
