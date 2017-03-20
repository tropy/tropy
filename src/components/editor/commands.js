'use strict'

const cmd  = require('prosemirror-commands')
const { undo, redo } = require('prosemirror-history')
const {
  wrapInList, splitListItem, liftListItem, sinkListItem
} = require('prosemirror-schema-list')


module.exports = (schema) => {
  const list = {
    ol: wrapInList(schema.nodes.ordered_list),
    ul: wrapInList(schema.nodes.bullet_list),
    splitListItem: splitListItem(schema.nodes.list_item),
    liftListItem: liftListItem(schema.nodes.list_item),
    sinkListItem: sinkListItem(schema.nodes.list_item),
  }

  return {
    ...cmd,
    ...list,

    undo,
    redo,

    bold: cmd.toggleMark(schema.marks.strong),
    italic: cmd.toggleMark(schema.marks.em),
    underline: cmd.toggleMark(schema.marks.underline),
    strikethrough: cmd.toggleMark(schema.marks.strikethrough),
    subscript: cmd.toggleMark(schema.marks.subscript),
    superscript: cmd.toggleMark(schema.marks.superscript),

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: cmd.chainCommands(
      list.splitListItem,
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      cmd.splitBlock
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
      cmd.deleteSelection,
      cmd.joinBackward
    ),

    del: cmd.chainCommands(
      cmd.deleteSelection,
      cmd.joinForward
    )
  }
}
