import React from 'react'
import { array, func, number, object } from 'prop-types'
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

  let range = items.slice(from, to)

  for (let i = 0; i < range.length; ++i) {
    let item = range[i]
    let isExpanded = !!expandedItems[item.id]

    output.push(renderItem(item, from + i, {
      isExpanded
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

Range.propTypes = {
  columns: number.isRequired,
  expandedItems: object.isRequired,
  from: number.isRequired,
  items: array.isRequired,
  to: number.isRequired,
  renderExpansionRow: func,
  renderItem: func.isRequired
}

Range.defaultProps = {
  columns: 1,
  expandedItems: {}
}
