'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { meta } = require('../../common/os')
const { times } = require('../../common/util')
const { arrayOf, shape, func, number, object, string } = PropTypes


class ItemIterator extends PureComponent {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  isSelected(item) {
    return this.props.selection.includes(item.id)
  }

  handleSelect = (item, event) => {
    const { selection, onSelect } = this.props
    const isSelected = this.isSelected(item)

    if (meta(event)) {
      onSelect(item.id, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected || selection.length > 1) {
        onSelect(item.id, 'replace')
      }
    }
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


  map(fn) {
    return this.props.items.map((item, idx) => fn({
      item,
      cache: this.props.cache,
      selection: this.props.selection,
      size: this.size,
      isLast: idx === this.props.items.length,
      isSelected: this.isSelected(item),
      nav: this.props.nav,
      onContextMenu: this.handleContextMenu,
      onDropPhotos: this.props.onPhotoMove,
      onItemOpen: this.props.onItemOpen,
      onSelect: this.handleSelect
    }))
  }

  static ZOOM = [
    24,
    ...times(57, i => i * 4 + 28),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static propTypes = {
    cache: string.isRequired,
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    nav: object.isRequired,
    selection: arrayOf(number).isRequired,
    zoom: number.isRequired,

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
