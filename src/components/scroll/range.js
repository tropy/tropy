import React from 'react'
import { ExpansionRow } from './expansion.js'

const getNextRowOffset = (index, columns) =>
  index + (columns - (index % columns))

export const Range = ({
  columns,
  isScrolling,
  items,
  expandedItems,
  from,
  to,
  renderExpansionRow,
  renderItem
}) => {
  let output = []
  let expansion

  let range = items.slice(from, to)

  for (let i = 0; i < range.length; ++i) {
    let item = range[i]
    let isExpanded = !!expandedItems[item.id]

    output.push(renderItem(item, from + i, {
      isExpanded,
      isScrolling
    }))

    // Invariant: in Grid there must be at most one expanded item!
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

Range.defaultProps = {
  columns: 1,
  expandedItems: {}
}
