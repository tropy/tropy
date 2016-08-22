'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')
const { Cell } = require('./cell')

class ListItem extends Component {

  static propTypes = {
    current: PropTypes.number,
    activate: PropTypes.func,
    item: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object)
  }

  constructor(props) {
    super(props)
  }

  activate = () => {
    this.props.activate(this.props.item.id)
  }

  render() {
    const { item, current, columns } = this.props

    return (
      <li
        className={cn({ item: true, active: current === item.id })}
        onClick={this.activate}>
        {columns.map(({ field, width }, idx) => (
          <Cell
            key={idx}
            type={field.type}
            value={item[field.name].value}
            icon={idx ? null : item.image}
            width={width}/>
        ))}
      </li>
    )
  }
}


module.exports = {
  ListItem
}
