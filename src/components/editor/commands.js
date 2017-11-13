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
    marks[name] = cmd.toggleMark(schema.marks[name])
  }

  return {
    ...cmd,
    ...list,
    ...marks,

    // some marks, e.g. 'link', accept attributes ({ href, title })
    link: (attrs) => cmd.toggleMark(schema.marks.link, attrs),

    undo,
    redo,

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: cmd.chainCommands(
      list.splitListItem,
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      cmd.splitBlockKeepMarks
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

    clearSelection: () => {
      const sel = getSelection()
      if (!sel.isCollapsed) sel.collapseToStart()

      return true
    }
  }
}
