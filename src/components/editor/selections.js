'use strict'

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

module.exports = {
  markExtend
}
