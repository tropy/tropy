import React from 'react'
import { array, func, number } from 'prop-types'
import { ExpansionRow } from './expansion'

const getNextRowOffset = (index, columns) =>
  index + (columns - (index % columns))

export const Range = ({
  columns,
  items,
  expandedItems,
  from,
  to,
  renderExpansionRow,
  renderItem
}) => {
  let output = []
  let expansion

  if (renderExpansionRow)
    expandedItems = expandedItems.slice(0, 1)

  let range = items.slice(from, to)

  for (let i = 0; i < range.length; ++i) {
    let item = range[i]
    let isExpanded = expandedItems.includes(item)

    output.push(renderItem(item, from + i, {
      isExpanded
    }))

    if (isExpanded && !expansion && renderExpansionRow) {
      expansion = {
        at: getNextRowOffset(i, columns),
        row: React.createElement(ExpansionRow, {
          item,
          columns,
          renderExpansionRow
        })
      }
    }
  }

  if (expansion)
    output.splice(expansion.at, 0, expansion.row)

  return output
}

Range.propTypes = {
  columns: number.isRequired,
  expandedItems: array.isRequired,
  from: number.isRequired,
  items: array.isRequired,
  to: number.isRequired,
  renderExpansionRow: func,
  renderItem: func.isRequired
}

Range.defaultProps = {
  columns: 1,
  expandedItems: []
}
