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

const markExtend = (selection, markType) => {
  if (!selection) return
  const { $cursor, $anchor } = selection
  const pos = $cursor || $anchor
  let startIndex = pos.index()
  let endIndex = pos.indexAfter()

  const hasMark = (index) => {
    // clicked outside edge of tag.
    if (index === pos.parent.childCount) {
      index--
    }
    const result = pos.parent.child(index).marks.filter(
      mark => mark.type.name === markType.name)
    return !!result.length
  }

  if (!hasMark(startIndex) && !hasMark(endIndex)) {
    return
  }
  while (startIndex > 0 && hasMark(startIndex)) {
    startIndex--
  }
  while ( endIndex < pos.parent.childCount && hasMark(endIndex)) {
    endIndex++
  }

  let startPos = pos.start()
  let endPos = startPos

  for (let i = 0; i < endIndex; i++) {
    let size = pos.parent.child(i).nodeSize
    if (i < startIndex) startPos += size
    endPos += size
  }

  return { from: startPos, to: endPos }
}

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
