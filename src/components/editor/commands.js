'use strict'

const cmd  = require('prosemirror-commands')
const { undo, redo } = require('prosemirror-history')
const { undoInputRule } = require('prosemirror-inputrules')
const {
  wrapInList,
  splitListItem,
  liftListItem,
  sinkListItem
} = require('prosemirror-schema-list')
const { TextSelection } = require('prosemirror-state')
const { markExtend } = require('./selections')


const expandAndRemoveMark = (markType) =>
  (state, dispatch) => {
    const range = markExtend(state.selection, markType)
    if (!range) return
    dispatch(
      state
        .tr
        .setSelection(TextSelection.create(state.doc, range.from, range.to))
        .removeMark(range.from, range.to, markType))
  }


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

module.exports = (schema) => {
  const list = {
    ol: wrapInList(schema.nodes.ordered_list),
    ul: wrapInList(schema.nodes.bullet_list),
    splitListItem: splitListItem(schema.nodes.list_item),
    liftListItem: liftListItem(schema.nodes.list_item),
    sinkListItem: sinkListItem(schema.nodes.list_item),
  }

  const marks = {}

  for (let name in schema.marks) {
    marks[name] = (state, dispatch, ...args) =>
      cmd.toggleMark(schema.marks[name], ...args)(state, dispatch)
  }

  return {
    ...cmd,
    ...list,
    ...marks,
    ...aligns,

    undo,
    redo,

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: (state, dispatch) =>
      cmd.chainCommands(
        list.splitListItem,
        cmd.createParagraphNear,
        cmd.liftEmptyBlock,
        cmd.splitBlockKeepMarks,
      )(state, dispatch && (tr => {
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
      })),

    br: (state, dispatch) => (
      dispatch(
        state
          .tr
          .replaceSelectionWith(schema.nodes.hard_break.create())
          .scrollIntoView()
      ), true
    ),

    backspace: cmd.chainCommands(
      undoInputRule,
      cmd.deleteSelection,
      cmd.joinBackward
    ),

    del: cmd.chainCommands(
      cmd.deleteSelection,
      cmd.joinForward
    ),

    insertLink: (state, dispatch, attrs) => {
      const url = attrs.href
      const { $cursor, ranges } = state.selection
      let from, to
      const tr = state.tr
      if ($cursor) {
        // insert link target as text, only if no text is selected
        from = $cursor.pos
        to = from + url.length
        tr.insertText(url, from)
      } else {
        from = ranges[0].$from.pos
        to = ranges[0].$to.pos
      }
      dispatch(
        tr.addMark(from, to, schema.marks.link.create(attrs)))
    },
    removeLink: expandAndRemoveMark(schema.marks.link),

    clearSelection: () => {
      const sel = getSelection()
      if (!sel.isCollapsed) sel.collapseToStart()

      return true
    }
  }
}
