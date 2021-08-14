import React from 'react'
import { func, number, object, string } from 'prop-types'

export const ExpansionRow = ({ item, columns, tag, renderExpansionRow }) =>
  React.createElement(tag, {
    key: `expansion-${item.id}`,
    className: 'tile-expansion',
    style: { gridColumnEnd: columns + 1 }
  }, renderExpansionRow(item, columns))

ExpansionRow.propTypes = {
  renderExpansionRow: func.isRequired,
  columns: number.isRequired,
  item: object.isRequired,
  tag: string.isRequired
}

ExpansionRow.defaultProps = {
  tag: 'li'
}

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
  expandedItems,
  isGrid,
  subItems = 'selections'
) =>
  isGrid ?
    getExpandedGridRows(columns, items, expandedItems, subItems) :
    getExpandedListRows(items, expandedItems, subItems)


const getExpandedListRows = (items, expandedItems, subItems) => {
  let rows = []
  let expansions = getExpansions(1, items, expandedItems, subItems)

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


const getExpandedGridRows = (columns, items, expandedItems, subItems) => {
  let rows = []
  let [expansion] = getExpansions(
    columns,
    items,
    expandedItems.slice(0, 1),
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


const getExpansions = (columns, items, expandedItems, subItems) => {
  let expansions = []

  for (let item of expandedItems) {
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
