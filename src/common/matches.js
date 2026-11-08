// Combining the search terms in JS (search.md, Next 3).
// Each term's query returns the subjects and notes it matched
// (models/item.js: term); here they are mapped to items (see
// selectSubjects in slices/qr.js), ANDed per item, and the
// contributors of items are derived from the same lists.

// The term lists of a database, cached by term until the next write:
// entries are valid for the write generation they were queried in.
// Bounded by the total number of ids, least recently used first.
export class TermCache {
  #entries = new Map()
  #size = 0

  constructor (max = 4e6) {
    this.max = max
  }

  get (key, generation) {
    let entry = this.#entries.get(key)
    if (entry == null) return null

    this.#entries.delete(key)

    if (entry.generation !== generation) {
      this.#size -= entry.size
      return null
    }

    this.#entries.set(key, entry)
    return entry.lists
  }

  set (key, generation, lists) {
    let size = lists.subjects.length + lists.notes.length
    let prev = this.#entries.get(key)

    if (prev != null) {
      this.#entries.delete(key)
      this.#size -= prev.size
    }

    this.#entries.set(key, { generation, lists, size })
    this.#size += size

    for (let [k, entry] of this.#entries) {
      if (this.#size <= this.max || k === key) break
      this.#entries.delete(k)
      this.#size -= entry.size
    }
  }

  get size () {
    return this.#size
  }
}

export const keyOf = ({ scope, prefix, text }) =>
  `${scope}:${prefix ? '*' : ''}:${text.toLowerCase()}`

// Marks reused across calls: an item matching terms 0..k carries
// the stamp base + k; a new call starts from a fresh base.
let stamps = new Int32Array(0)
let base = 0

// The ids of the view matching every term's lists (per-item AND),
// in the view's order.
export function membership (view, lists, { itemOf, subjectOfNote }) {
  if (stamps.length < itemOf.length) {
    stamps = new Int32Array(itemOf.length)
    base = 0
  }

  if (base > 0x7fff0000 - lists.length) {
    stamps.fill(0)
    base = 0
  }

  let first = base + 1
  base += lists.length

  lists.forEach(({ subjects, notes }, k) => {
    let stamp = first + k
    let prev = stamp - 1

    let mark = (item) => {
      if (item > 0 && (k === 0 || stamps[item] === prev))
        stamps[item] = stamp
    }

    for (let i = 0; i < subjects.length; ++i)
      mark(itemOf[subjects[i]] ?? 0)
    for (let i = 0; i < notes.length; ++i)
      mark(itemOf[subjectOfNote(notes[i])] ?? 0)
  })

  let last = base
  return view.filter(id => stamps[id] === last)
}

// The contributors of the given items: their photos and notes in any
// term's lists. Selections, and the notes of photos and selections,
// roll up to their photo (they show with it). Item level matches
// (item metadata, tags) make an item match but contribute nothing.
export function contributors (items, lists, { itemOf, photoOf, subjectOfNote }) {
  let wanted = new Set(items)
  let photos = new Set()
  let notes = new Set()

  for (let list of lists) {
    for (let id of list.subjects)
      if (photoOf[id] && wanted.has(itemOf[id]))
        photos.add(photoOf[id])

    for (let note of list.notes) {
      let subject = subjectOfNote(note)

      if (wanted.has(itemOf[subject])) {
        notes.add(note)
        if (photoOf[subject]) photos.add(photoOf[subject])
      }
    }
  }

  return { photos, notes }
}
