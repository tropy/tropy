'use strict'

const hasMark = (pos, index, markType) =>
      markType.isInSet(pos.parent.child(index).marks)

const calculate = (pos, markType) => {
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

const markExtend = (selection, markType) => {
  if (!selection) return

  return {
    from: calculate(selection.$from, markType).from,
    to: calculate(selection.$to, markType).to
  }
}

module.exports = {
  markExtend
}
