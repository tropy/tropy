const hasMark = (pos, index, markType) =>
      markType.isInSet(pos.parent.child(index).marks)

const expand = (pos, markType) => {
  let startIndex = pos.index()
  let endIndex = pos.indexAfter()

  if (startIndex === pos.parent.childCount) {
    startIndex--
  }
  while (startIndex > 0 && hasMark(pos, startIndex, markType)) {
    startIndex--
  }
  while (endIndex < pos.parent.childCount && hasMark(pos, endIndex, markType)) {
    endIndex++
  }

  let startPos = pos.start()
  let endPos = startPos

  for (let i = 0; i < endIndex; i++) {
    let size = pos.parent.child(i).nodeSize
    if (i <= startIndex) startPos += size
    endPos += size
  }

  return { from: startPos, to: endPos }
}

export function markExtend(selection, markType) {
  if (!selection || selection.empty && !selection.$cursor)
    return null

  if (selection.$cursor)
    return expand(selection.$cursor, markType)

  if (selection.empty)
    return null

  let { from } = (markType.isInSet(selection.$from.marks())) ?
    expand(selection.$from, markType) : selection

  let { to } = (markType.isInSet(selection.$to.marks())) ?
    expand(selection.$to, markType) : selection

  return { from, to }
}
