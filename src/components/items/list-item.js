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

  select = () => {
    this.props.onSelect(this.props.item.id)
  }

  render() {
    const { item, current, columns } = this.props

    return (
      <tr
        className={cn({ item: true, active: current === item.id })}
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
