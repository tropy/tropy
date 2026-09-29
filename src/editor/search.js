// Plain, dependency-free helpers for "find in note". Deliberately NOT a
// ProseMirror Plugin: Tropy's EditorView wires up a custom
// dispatchTransaction (see components/editor/view.js) that routes every
// dispatched transaction through the app's onChange -> Redux -> props
// round-trip instead of updating view.state synchronously. That is fine
// for real edits, but it means code that reads back its own dispatch
// result on the same tick (as a PM Plugin's state would) sees stale
// data. Search state is therefore kept as plain component state (see
// components/editor/search.js) and only reads the live document
// directly; this module has no notion of "current search" at all, just
// pure functions over a doc, a query and a set of matches.

import { Decoration, DecorationSet } from 'prosemirror-view'

// Case-insensitive substring search, mirroring simple "find in page"
// behaviour rather than a full regex search.
export function findMatches (doc, query) {
  let matches = []

  if (!query)
    return matches

  let needle = query.toLowerCase()

  doc.descendants((node, pos) => {
    if (!node.isText)
      return

    let text = node.text.toLowerCase()
    let idx = text.indexOf(needle)

    while (idx > -1) {
      matches.push({
        from: pos + idx,
        to: pos + idx + needle.length
      })
      idx = text.indexOf(needle, idx + 1)
    }
  })

  return matches
}

export function decorateMatches (doc, matches, active) {
  if (!matches.length)
    return DecorationSet.empty

  let decorations = matches.map(({ from, to }, idx) =>
    Decoration.inline(from, to, {
      class: idx === active ? 'search-match active' : 'search-match'
    }))

  return DecorationSet.create(doc, decorations)
}
