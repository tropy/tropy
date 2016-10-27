'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')
const { Cell } = require('./cell')

class ListItem extends Component {

  static propTypes = {
    current: PropTypes.number,
    onSelect: PropTypes.func,
    item: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object)
  }

  constructor(props) {
    super(props)
  }

  get active() {
    return this.props.item.id === this.props.current
  }

  select = () => {
    if (!this.active) {
      this.props.onSelect(this.props.item.id)
    }
  }

  render() {
    const { item, columns } = this.props

    return (
      <tr
        className={cn({ item: true, active: this.active })}
        onClick={this.select}>
        {columns.map(({ property, width }, idx) => (
          <Cell
            key={idx}
            type={property.type}
            value={item[property.name]}
            icon={idx ? null : item.image}
            width={width}/>
        ))}
      </tr>
    )
  }
}


module.exports = {
  ListItem
}
