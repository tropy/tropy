
export function isBlank(doc) {
  if (doc == null)
    return true
  if (doc.childCount !== 1)
    return false
  if (!doc.firstChild.isTextblock)
    return false
  if (doc.firstChild.content.size !== 0)
    return false

  return true
}

export function getMarks(state) {
  let { schema } = state
  let marks = {}

  for (let id in schema.marks) {
    marks[id] = isMarkActive(schema.marks[id], state)
  }

  return marks
}

export function isMarkActive(mark, state) {
  let { doc, selection, storedMarks } = state

  if (selection.empty)
    return !!mark.isInSet(storedMarks || selection.$from.marks())
  else
    return doc.rangeHasMark(selection.from, selection.to, mark)
}

export function getAlignment(state) {
  let { doc, selection } = state
  let align = { left: false, right: false, center: false }

  doc.nodesBetween(
    selection.from,
    selection.to,
    (node) => {
      if (node.type.attrs.align) {
        align[node.attrs.align] = true
      }
    })

  return align
}

export function getLink(state) {
  let { schema, selection } = state

  if (selection.$cursor) {
    for (let mark of selection.$cursor.marks()) {
      if (mark.type === schema.marks.link)
        return mark.attrs
    }
  }

  return null
}
