import React from 'react'
import { array, func, number } from 'prop-types'

export class Range extends React.PureComponent {

  renderItem = (item, index) => {
    return this.props.mapper(item, this.props.from + index)
  }

  render() {
    return this.props.items
      .slice(this.props.from, this.props.to)
      .map(this.renderItem)
  }

  static propTypes = {
    items: array.isRequired,
    from: number.isRequired,
    to: number.isRequired,
    mapper: func.isRequired
  }
}
