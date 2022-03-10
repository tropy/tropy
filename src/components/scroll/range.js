import React from 'react'
import { array, bool, func, number, object } from 'prop-types'
import { ExpansionRow } from './expansion'

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
  renderItem,
  isSelected,
  onSelect
}) => {
  let output = []
  let expansion

  let range = items.slice(from, to)

  for (let i = 0; i < range.length; ++i) {
    let item = range[i]
    let isExpanded = !!expandedItems[item.id]

    output.push(renderItem(item, from + i, {
      isExpanded,
      isScrolling,
      isSelected: isSelected(item),
      onSelect
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
  isScrolling: bool,
  isSelected: func.isRequired,
  items: array.isRequired,
  onSelect: func.isRequired,
  renderExpansionRow: func,
  renderItem: func.isRequired,
  to: number.isRequired
}

Range.defaultProps = {
  columns: 1,
  isSelected: () => {},
  expandedItems: {}
}
