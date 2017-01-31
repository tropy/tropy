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

  isSelected(item) {
    return this.props.selection.includes(item.id)
  }


  handleSelect = (id, mod) => {
    this.props.onSelect(id, mod)
  }

  handleContextMenu = (item, event) => {
    const { nav, selection, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = selection
    }

    if (nav.list) {
      context.push('list')
      target.list = nav.list
    }

    if (item.deleted) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  handleClickOutside = () => {
    this.props.onSelect()
  }

  handleClickInside = (event) => {
    event.stopPropagation()
  }


  render() {
    const { items, onPhotoMove, ...props } = this.props
    const tile = this.placeholder

    return (
      <div className="item-grid-view">
        <ul
          className="item-grid"
          onClick={this.handleClickOutside}>
          {items.map((item) =>
            <ItemTile {...props}
              key={item.id}
              item={item}
              size={this.size}
              isSelected={this.isSelected(item)}
              onSelect={this.handleSelect}
              onClick={this.handleClickInside}
              onContextMenu={this.handleContextMenu}
              onDropPhotos={onPhotoMove}/>
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
    ...times(57, i => i * 4 + 28),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static propTypes = {
    selection: PropTypes.arrayOf(PropTypes.number),
    cache: PropTypes.string.isRequired,
    nav: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object),
    items: PropTypes.arrayOf(PropTypes.object),
    zoom: Shapes.number(1, ItemGrid.ZOOM.length - 1),
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func,
    onPhotoMove: PropTypes.func
  }
}


module.exports = {
  ItemGrid
}
