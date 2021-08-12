
export const getExpandedRowsAbove = (rows, x) => {
  let numRowsAbove = 0
  let expRowPosition = 0

  for (let row of rows) {
    if (x < row.position)
      break

    if (x === row.position)
      expRowPosition = row.expRowPosition

    numRowsAbove = row.numRowsAbove
  }

  return { numRowsAbove, expRowPosition }
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

  for (let { index, numRows } of expansions) {
    index += count

    for (let i = 1; i <= numRows; ++i)
      rows.push({
        position: ++index,
        numRowsAbove: ++count,
        expRowPosition: i
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
    let { index, numRows } = expansion

    for (let i = 1; i <= numRows; ++i)
      rows.push({
        position: ++index,
        numRowsAbove: i,
        expRowPosition: i
      })
  }

  return rows
}


const getExpansions = (columns, items, expanded, subItems) => {
  let expansions = []

  for (let item of expanded) {
    let numRows = Math.ceil(item?.[subItems].length / columns) || 0
    let index = Math.floor(indexOf(items, item.id) / columns)

    if (index >= 0)
      expansions.push({ index, numRows })
  }

  return expansions.sort(byIndex)
}


const indexOf = (collection, id) =>
  (collection.idx != null) ?
    collection.idx[id] :
    collection.findIndex(it => it.id === id)


const byIndex = (a, b) =>
  (a.index < b.index) ? -1 : (a.index > b.index) ? 1 : 0
