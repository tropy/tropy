import React from 'react'
import { array, func, number } from 'prop-types'

export class Range extends React.Component {

  getNextRowOffset(index) {
    return index + (this.props.columns - (index % this.props.columns))
  }

  renderItem = (item, index) => {
    return this.props.mapper(item, this.props.from + index, this)
  }

  renderExpansionRow = (index, output) => {
    this.expansion = {
      at: this.getNextRowOffset(index - this.props.from),
      output: (
        <li
          key="expansion"
          className="tile-expansion"
          style={{ gridColumnEnd: this.props.columns + 1 }}>
          {output}
        </li>
      )
    }
  }

  render() {
    try {
      let range = this.props.items.slice(this.props.from, this.props.to)
      let output = range.map(this.renderItem)

      if (this.expansion) {
        output.splice(this.expansion.at, 0, this.expansion.output)
      }

      return output

    } finally {
      this.expansion = null
    }
  }

  static propTypes = {
    columns: number.isRequired,
    items: array.isRequired,
    from: number.isRequired,
    to: number.isRequired,
    mapper: func.isRequired
  }

  static defaultProps = {
    columns: 1
  }
}
