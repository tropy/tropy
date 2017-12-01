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
const align = require('./alignment')


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
    ...align.alignCommands,

    undo,
    redo,

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: cmd.chainCommands(
      align.splitListItemKeepAlignment(schema.nodes.list_item),
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      align.splitBlockKeepAlignment
    ),

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
