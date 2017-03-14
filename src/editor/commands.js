'use strict'

const cmd  = require('prosemirror-commands')

module.exports = {
  ...cmd,

  enter: cmd.chainCommands(
    cmd.newlineInCode,
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
