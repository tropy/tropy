import React from 'react'
import { array, func, number } from 'prop-types'
import { ExpansionRow } from './expansion'

const getNextRowOffset = (index, columns) =>
  index + (columns - (index % columns))

export const Range = ({ columns, renderExpansionRow, ...props }) => {
  let output = []
  let expansion

  let range = props.items.slice(props.from, props.to)

  for (let i = 0; i < range.length; ++i) {
    let item = range[i]
    let isExpanded = props.expandedItems.includes(item)

    output.push(props.renderItem(item, props.from + i, {
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

  if (expansion) {
    output.splice(expansion.at, 0, expansion.row)
  }

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
