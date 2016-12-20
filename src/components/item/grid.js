'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ItemTile } = require('./tile')
const { Shapes } = require('../util')
const { times } = require('../../common/util')


class ItemGrid extends Component {

  get size() {
    return ItemGrid.ZOOM[this.props.zoom]
  }

  get placeholder() {
    return (
      <li className="item-tile" style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }

  handleSelect = (id, mod) => {
    this.props.onSelect(id, mod)
  }

  handleContextMenu = (event, item) => {
    const { selection, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = selection
    }

    if (item.deleted) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  render() {
    const { selection, items, ...props } = this.props
    const tile = this.placeholder

    return (
      <div className="item-grid-view">
        <ul className="item-grid">
          {items.map((item) =>
            <ItemTile {...props}
              key={item.id}
              item={item}
              size={this.size}
              isSelected={selection.includes(item.id)}
              onSelect={this.handleSelect}
              onContextMenu={this.handleContextMenu}/>
          )}

          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        </ul>
      </div>
    )
  }

  static ZOOM = [
    24,
    ...times(56, i => i * 4 + 32),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static propTypes = {
    selection: PropTypes.arrayOf(PropTypes.number),
    cache: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object),
    items: PropTypes.arrayOf(PropTypes.object),
    zoom: Shapes.number(1, ItemGrid.ZOOM.length - 1),
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}


module.exports = {
  ItemGrid
}
