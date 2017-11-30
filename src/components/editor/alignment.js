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
      let offset = 1
      // if we are within a list, the target node is further away
      if (prev.node(prev.depth - 1).type.name === 'list_item') {
        offset += 2
      }
      tr.setNodeMarkup(pos + offset, null, { align: direction })
    }
    tr.ensureMarks(prevMarks)
  }
  dispatch(tr)
})

module.exports = {
  aligns,
  keepAlignment
}
