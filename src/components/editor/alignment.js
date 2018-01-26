'use strict'

const { splitListItem } = require('prosemirror-schema-list')
const { splitBlockKeepMarks }  = require('prosemirror-commands')

const align = (direction) =>
  (state, dispatch) => {
    let tr = state.tr
    let changes = false

    state.doc.nodesBetween(
      state.selection.from,
      state.selection.to,
      (node, pos) => {
        // align nodes that support alignment
        if (node.type.attrs.align) {
          changes = true
          tr.setNodeMarkup(pos, null, { align: direction })
        }
      })

    if (!changes) return false
    if (dispatch) dispatch(tr)

    return true
  }


// Maintain alignment and marks by appending the `align` attribute to newly created paragraphs
// (based on `align` attribute value of the preceding node).
// Supports both lists and regular markup.
// nodeOffset is how far ahead from the current position to insert the alignment attributes.
const keepAlignment = (state, dispatch, nodeOffset) => (tr => {
  const cursor = state.selection.$cursor || state.selection.$from
  const { pos, parentOffset } = cursor
  const prev = state.doc.resolve(pos - parentOffset)
  if (prev && prev.parent) {
    const direction = prev.parent.attrs.align
    const prevMarks = state.doc.resolve(pos).marks()
    if (direction && direction !== 'left') {
      tr.setNodeMarkup(pos + nodeOffset, null, { align: direction })
    }
    tr.ensureMarks(prevMarks)
  }
  dispatch(tr)
})

const splitListItemKeepAlignment = (listItemType) => {
  const splitCmd = splitListItem(listItemType)
  return (state, dispatch) =>
    splitCmd(state, dispatch && keepAlignment(state, dispatch, 3))
}

const splitBlockKeepAlignment = (state, dispatch) =>
  splitBlockKeepMarks(state, dispatch && keepAlignment(state, dispatch, 1))

module.exports = {
  alignment(schema) {
    return {
      left: align('left'),
      center: align('center'),
      right: align('right'),
      splitBlock: splitBlockKeepAlignment,
      splitListItem: splitListItemKeepAlignment(schema.nodes.list_item)
    }
  }
}
