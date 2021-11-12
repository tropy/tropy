import * as cmd from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import { list } from './list'
import { undoInputRule } from 'prosemirror-inputrules'
import { TextSelection } from 'prosemirror-state'
import { markExtend } from './selections'
import { alignment } from './alignment'


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

export function createCommands(schema) {
  const align = alignment(schema)
  const marks = {}

  for (let name in schema.marks) {
    marks[name] = (state, dispatch, ...args) =>
      cmd.toggleMark(schema.marks[name], ...args)(state, dispatch)
  }

  return {
    ...cmd,
    ...list(schema),
    ...marks,

    left: align.left,
    right: align.right,
    center: align.center,

    undo,
    redo,

    blockquote: cmd.wrapIn(schema.nodes.blockquote),

    break: cmd.chainCommands(
      align.splitListItem,
      cmd.createParagraphNear,
      cmd.liftEmptyBlock,
      align.splitBlock
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
      let { selection, tr } = state
      let { $cursor } = selection

      if ($cursor) {
        if ($cursor.marks().find(m => m.type === schema.marks.link)) {
          // Expand selection if cursor is on a link
          selection = markExtend(selection, schema.marks.link)

        } else {
          // Insert link target as text, if no text is selected
          selection = {
            from: $cursor.pos,
            to: $cursor.pos + attrs.href.length
          }

          tr.insertText(attrs.href, selection.from)
        }
      }

      let { from, to } = selection

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
