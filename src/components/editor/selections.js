'use strict'

const markExtend = (selection, markType) => {
  if (!selection) return

  const hasMark = (pos, index) =>
    markType.isInSet(pos.parent.child(index).marks)

  const calculate = (pos) => {
    let startIndex = pos.index()
    let endIndex = pos.indexAfter()

    if (startIndex === pos.parent.childCount) {
      startIndex--
    }
    while (startIndex > 0 && hasMark(pos, startIndex)) {
      startIndex--
    }
    while (endIndex < pos.parent.childCount && hasMark(pos, endIndex)) {
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

  return {
    from: calculate(selection.$from).from,
    to: calculate(selection.$to).to
  }
}

module.exports = {
  markExtend
}
