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
      const { href } = attrs
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

    updateLink(state, dispatch, attrs) {
      let { from, to } = markExtend(state.selection, schema.marks.link)

      if (dispatch)
        dispatch(state.tr.addMark(from, to, schema.marks.link.create(attrs)))

      return true
    },

    clearSelection() {
      const sel = getSelection()
      if (!sel.isCollapsed) sel.collapseToStart()

      return true
    }
  }
}
