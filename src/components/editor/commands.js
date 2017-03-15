'use strict'

const cmd  = require('prosemirror-commands')
const { undo, redo } = require('prosemirror-history')

module.exports = {
  ...cmd,

  undo,
  redo,

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
