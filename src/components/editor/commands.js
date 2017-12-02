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
    if (!range) return false

    if (dispatch) {
      dispatch(
        state
          .tr
          .setSelection(TextSelection.create(state.doc, range.from, range.to))
          .removeMark(range.from, range.to, markType))
    }

    return true
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

    undo,
    redo,

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: cmd.chainCommands(
      list.splitListItem,
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      cmd.splitBlockKeepMarks
    ),

    br(state, dispatch) {
      if (dispatch) {
        dispatch(
          state
            .tr
            .replaceSelectionWith(schema.nodes.hard_break.create())
            .scrollIntoView()
        )
      }
      return true
    },

    backspace: cmd.chainCommands(
      undoInputRule,
      cmd.deleteSelection,
      cmd.joinBackward
    ),

    del: cmd.chainCommands(
      cmd.deleteSelection,
      cmd.joinForward
    ),

    insertLink(state, dispatch, attrs) {
      const { href } = attrs.href
      const { $cursor, ranges } = state.selection
      const { tr } = state
      let from, to

      // Insert link target as text, if no text is selected
      if ($cursor) {
        from = $cursor.pos
        to = from + href.length
        tr.insertText(href, from)
      } else {
        from = ranges[0].$from.pos
        to = ranges[0].$to.pos
      }

      if (dispatch) {
        dispatch(tr.addMark(from, to, schema.marks.link.create(attrs)))
      }

      return true
    },

    removeLink: expandAndRemoveMark(schema.marks.link),

    clearSelection() {
      const sel = getSelection()
      if (!sel.isCollapsed) sel.collapseToStart()

      return true
    }
  }
}
