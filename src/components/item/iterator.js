'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { times } = require('../../common/util')
const { has } = require('../../dom')
const { STYLE } = require('../../constants')
const { arrayOf, oneOf, shape, bool, func, number, string } = PropTypes


class ItemIterator extends PureComponent {
  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  get orientation() {
    return this.isVertical ? 'vertical' : 'horizontal'
  }

  get isVertical() {
    return true
  }

  get isEmpty() {
    return this.props.items.length === 0
  }

  get tabIndex() {
    return this.isEmpty ? null : STYLE.TABS[this.constructor.name]
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

  setContainer = (container) => {
    this.container = container
  }

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
    switch (event.key) {
      case (this.isVertical ? 'ArrowUp' : 'ArrowLeft'):
        this.select(this.getPrevItem())
        break

      case (this.isVertical ? 'ArrowDown' : 'ArrowRight'):
        this.select(this.getNextItem())
        break

      case ' ':
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
    const { orientation } = this

    return this.props.items.map((item, index) => {
      this.idx[item.id] = index

      return fn({
        item,
        cache: this.props.cache,
        orientation,
        isLast: index === this.props.items.length - 1,
        isSelected: this.isSelected(item),
        isDisabled: this.props.isDisabled,
        getSelection: this.getSelection,
        onContextMenu: this.handleContextMenu,
        onDropPhotos: this.props.onPhotoMove,
        onItemOpen: this.props.onItemOpen,
        onSelect: this.props.onSelect
      })
    })
  }

  static ZOOM = [
    48,
    ...times(51, i => i * 4 + 52),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static get props() {
    return Object.keys(this.propTypes)
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
    list: number,
    zoom: number.isRequired,

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
  ItemIterator,
  ZOOM: ItemIterator.ZOOM
}
