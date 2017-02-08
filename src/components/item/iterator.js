'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { times } = require('../../common/util')
const { arrayOf, shape, bool, func, number, object, string } = PropTypes


class ItemIterator extends PureComponent {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  isSelected(item) {
    return this.props.selection.includes(item.id)
  }

  handleClickOutside = () => {
    this.props.onSelect()
  }

  connect(element) {
    return (this.props.isDisabled) ? element : this.props.dt(element)
  }

  map(fn) {
    return this.props.items.map((item, idx) => fn({
      item,
      cache: this.props.cache,
      selection: this.props.selection,
      size: this.size,
      isLast: idx === this.props.items.length - 1,
      isSelected: this.isSelected(item),
      nav: this.props.nav,
      onContextMenu: this.props.onContextMenu,
      onDropPhotos: this.props.onPhotoMove,
      onItemOpen: this.props.onItemOpen,
      onSelect: this.props.onSelect
    }))
  }

  static ZOOM = [
    24,
    ...times(57, i => i * 4 + 28),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static propTypes = {
    isOver: bool,
    isDisabled: bool,

    cache: string.isRequired,
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    nav: object.isRequired,
    selection: arrayOf(number).isRequired,
    zoom: number.isRequired,

    dt: func.isRequired,
    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onPhotoMove: func.isRequired,
    onSelect: func.isRequired
  }
}


module.exports = {
  ItemIterator,
  ZOOM: ItemIterator.ZOOM
}
