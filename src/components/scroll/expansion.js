import { indexOf } from '../../common/sequence.js'

export const getExpandedRowsAbove = (rows, { index, position }) => {
  let numRowsAbove = 0
  let expRowPosition = 0

  for (let row of rows) {
    if (index != null && index <= row.index)
      break
    if (position != null && position < row.position)
      break

    if (position === row.position)
      expRowPosition = row.expRowPosition

    numRowsAbove = row.numRowsAbove
  }

  return { numRowsAbove, expRowPosition }
}

export const getExpandedRows = (items, expandedItems) => {
  let rows = []
  let expansions = getExpansions(items, expandedItems)

  let count = 0

  for (let { index, numRows } of expansions) {
    let position = index + count

    for (let i = 1; i <= numRows; ++i)
      rows.push({
        index,
        position: position + i,
        numRowsAbove: ++count,
        expRowPosition: i
      })
  }

  return rows
}


const getExpansions = (items, expandedItems) => {
  let expansions = []

  for (let id in expandedItems) {
    let index = indexOf(items, id)

    if (index >= 0)
      expansions.push({
        index,
        numRows: expandedItems[id].length
      })
  }

  return expansions.sort(byIndex)
}

const byIndex = (a, b) =>
  (a.index < b.index) ? -1 : (a.index > b.index) ? 1 : 0
