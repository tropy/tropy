'use strict'

const React = require('react')
const { PropTypes } = React
const { Iterator } = require('../iterator')
const { has } = require('../../dom')
const { match } = require('../../keymap')

const {
  arrayOf, oneOf, shape, bool, func, number, object, string
} = PropTypes


class ItemIterator extends Iterator {
  get iteration() {
    return this.props.items
  }

  isSelected(item) {
    return this.props.selection.includes(item.id)
  }

  getNextItem(offset = 1) {
    const { items, selection } = this.props

    if (!items.length) return null
    if (!selection.length) return items[0]

    const idx = this.idx[selection[selection.length - 1]] + offset

    return (idx >= 0 && idx < items.length) ? items[idx] : null
  }

  getPrevItem(offset = 1) {
    return this.getNextItem(-offset)
  }

  getCurrentItem() {
    return this.getNextItem(0)
  }

  getSelection = () => this.props.selection

  handleClickOutside = (event) => {
    if (has(event.target, 'click-catcher')) {
      this.props.onSelect()
    }
  }

  handleFocus = () => {
    this.select(this.getCurrentItem())
  }

  handleContextMenu = (event, item) => {
    const { list, isDisabled, selection, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags, list }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = [...selection]

      if (!this.isSelected(item)) {
        target.id.push(item.id)
      }
    }

    if (list) context.push('list')
    if (isDisabled) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.select(this.getPrevItem())
        break

      case (this.isVertical ? 'down' : 'right'):
        this.select(this.getNextItem())
        break

      case 'open':
        this.props.onItemOpen(this.getCurrentItem())
        break

      case 'preview':
        this.props.onItemPreview(this.getCurrentItem())
        break

      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }


  select(item) {
    if (item && !this.isSelected(item)) {
      this.props.onSelect(item.id, 'replace', { throttle: true })
    }
  }

  connect(element) {
    return (this.props.isDisabled) ? element : this.props.dt(element)
  }

  map(fn) {
    this.idx = {}

    return this.props.items.map((item, index) => {
      this.idx[item.id] = index

      return fn({
        item,
        cache: this.props.cache,
        isLast: index === this.props.items.length - 1,
        isSelected: this.isSelected(item),
        isDisabled: this.props.isDisabled,
        isVertical: this.isVertical,
        getSelection: this.getSelection,
        onContextMenu: this.handleContextMenu,
        onDropPhotos: this.props.onPhotoMove,
        onItemOpen: this.props.onItemOpen,
        onSelect: this.props.onSelect
      })
    })
  }

  static propTypes = {
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired,

    sort: shape({
      asc: bool,
      column: string.isRequired,
      type: oneOf(['property']).isRequired
    }).isRequired,

    isOver: bool,
    isDisabled: bool,

    cache: string.isRequired,
    selection: arrayOf(number).isRequired,
    keymap: object.isRequired,
    list: number,
    size: number.isRequired,

    dt: func.isRequired,
    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onItemPreview: func.isRequired,
    onPhotoMove: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired
  }
}


module.exports = {
  ItemIterator
}
