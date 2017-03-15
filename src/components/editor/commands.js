'use strict'

const cmd  = require('prosemirror-commands')
const { undo, redo } = require('prosemirror-history')
const {
  wrapInList, splitListItem, liftListItem, sinkListItem
} = require('prosemirror-schema-list')


module.exports = {
  commands: {
    ...cmd,

    undo,
    redo,

    wrapInList,
    splitListItem,
    liftListItem,
    sinkListItem,

    break: cmd.chainCommands(
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      cmd.splitBlock
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
