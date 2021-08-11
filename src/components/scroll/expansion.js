
export const getExpandedRowsAbove = (rows, x) => {
  let numRowsAbove = 0
  let numOffsetRows = 0

  for (let row of rows) {
    if (x < row.position)
      break

    if (x === row.position)
      numOffsetRows = row.numOffsetRows

    numRowsAbove = row.numRowsAbove
  }

  return { numRowsAbove, numOffsetRows }
}

export const getExpandedRows = (
  columns,
  items,
  expanded,
  isGrid,
  subItems = 'selections'
) =>
  isGrid ?
    getExpandedGridRows(columns, items, expanded, subItems) :
    getExpandedListRows(items, expanded, subItems)


const getExpandedListRows = (items, expanded, subItems) => {
  let rows = []
  let expansions = getExpansions(1, items, expanded, subItems)

  let count = 0

  for (let { position, numRows } of expansions) {
    position += count

    for (let i = 1; i <= numRows; ++i)
      rows.push({
        position: ++position,
        numRowsAbove: ++count,
        numOffsetRows: i
      })
  }

  return rows
}


const getExpandedGridRows = (columns, items, expanded, subItems) => {
  let rows = []
  let [expansion] = getExpansions(
    columns,
    items,
    expanded.slice(0, 1),
    subItems)

  if (expansion) {
    let { position, numRows } = expansion
    position = Math.floor(position / columns)

    for (let i = 1; i <= numRows; ++i)
      rows.push({
        position: ++position,
        numRowsAbove: i,
        numOffsetRows: i
      })
  }

  return rows
}


const getExpansions = (columns, items, expanded, subItems) => {
  let expansions = []

  for (let item of expanded) {
    let numRows = Math.ceil(item?.[subItems].length / columns) || 0
    let position = indexOf(items, item.id)

    if (position >= 0)
      expansions.push({ position, numRows })
  }

  return expansions.sort(byPosition)
}


const indexOf = (collection, id) =>
  (collection.idx != null) ?
    collection.idx[id] :
    collection.findIndex(it => it.id === id)


const byPosition = (a, b) =>
  (a.position < b.position) ? -1 : (a.position > b.position) ? 1 : 0


