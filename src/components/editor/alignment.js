'use strict'

const alignCmd = (direction) =>
  (state, dispatch) => {
    let tr = state.tr
    state.doc.nodesBetween(
      state.selection.from,
      state.selection.to,
      (node, pos) => {
        // align nodes that support alignment
        if (node.type.attrs.align) {
          tr.setNodeMarkup(pos, null, { align: direction })
        }
      })
    dispatch(tr)
  }

const aligns = {
  left: alignCmd('left'),
  right: alignCmd('right'),
  center: alignCmd('center'),
}

// Maintain alignment and marks by appending the `align` attribute to newly created paragraphs
// (based on `align` attribute value of the preceding node).
// Supports both lists and regular markup.
const keepAlignment = (state, dispatch) => (tr => {
  const { pos, parentOffset } = state.selection.$cursor
  const prev = state.doc.resolve(pos - parentOffset)
  if (prev && prev.parent) {
    const direction = prev.parent.attrs.align
    const prevMarks = state.doc.resolve(pos).marks()
    if (direction && direction !== 'left') {
      // if we are within a list:
      if (prev.node(prev.depth - 1).type.name === 'list_item') {
        // We need to dispatch the previous changes. This will update the UI.
        dispatch(tr)
        // The old state state does not have the new list item yet, so we cannot
        // align the paragraph within this new list item.
        // We build a new state, that now has this new paragraph and list item.
        const newState = state.apply(tr)
        // Align the paragraph within the new list item
        tr = newState.tr.setNodeMarkup(
          pos + 3, null, { align: direction })
      } else {
        // we are not within a list, align the new paragraph
        tr.setNodeMarkup(pos + 1, null, { align: direction })
      }
    }
    tr.ensureMarks(prevMarks)
  }
  dispatch(tr)
})

module.exports = {
  aligns,
  keepAlignment
}
