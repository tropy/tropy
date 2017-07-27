'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { has } = require('../../dom')
const { match } = require('../../keymap')

const {
  arrayOf, oneOf, shape, bool, func, number, object, string
} = require('prop-types')


class ItemIterator extends Iterator {
  get iteration() {
    return this.props.items
  }

  get tabIndex() {
    return this.props.isActive ? super.tabIndex : null
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
      this.props.onSelect({ items: [] })
    }
  }

  handleFocus = () => {
    this.select(this.getCurrentItem())
  }

  handleContextMenu = (event, item) => {
    const { list, isDisabled, selection, onContextMenu } = this.props

    const context = ['item']
    const target = {
      id: item.id, photos: item.photos, tags: item.tags, list
    }

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

  handleItemDelete(items) {
    if (!this.props.isDisabled && items != null && items.length > 0) {
      this.props.onItemDelete(items)
    }
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
      case 'clear':
        this.props.onSelect({ items: [] })
        break
      case 'delete':
        this.handleItemDelete(this.props.selection)
        this.select(this.getNextItem() || this.getPrevItem())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }


  select(item) {
    if (item && !this.isSelected(item)) {
      this.props.onSelect({ items: [item.id] }, 'replace', { throttle: true })
    }
  }

  connect(element) {
    return (this.isDisabled) ? element : this.props.dt(element)
  }

  map(fn) {
    this.idx = {}

    return this.props.items.map((item, index) => {
      this.idx[item.id] = index

      return fn({
        item,
        cache: this.props.cache,
        photos: this.props.photos,
        tags: this.props.tags,
        isLast: index === this.props.items.length - 1,
        isSelected: this.isSelected(item),
        isDisabled: this.isDisabled,
        isVertical: this.isVertical,
        getSelection: this.getSelection,
        onContextMenu: this.handleContextMenu,
        onDropItems: this.props.onItemMerge,
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

    isActive: bool,
    isOver: bool,
    isDisabled: bool,

    cache: string.isRequired,
    selection: arrayOf(number).isRequired,
    keymap: object.isRequired,
    list: number,
    size: number.isRequired,
    photos: object.isRequired,
    tags: object.isRequired,

    dt: func.isRequired,
    onContextMenu: func.isRequired,
    onItemDelete: func.isRequired,
    onItemMerge: func.isRequired,
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
