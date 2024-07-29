import React from 'react'
import { match, isMeta as meta } from '../../keymap.js'
import { indexOf } from '../../common/collection.js'
import { blank, get } from '../../common/util.js'
import { on, off } from '../../dom.js'
import { seq, compose, map, cat, keep } from 'transducers.js'
import { TABS } from '../../constants/index.js'


export class ItemIterator extends React.Component {
  container = React.createRef()
  state = {}

  componentDidMount() {
    on(document, 'global:nextItem', this.handleNextItem)
    on(document, 'global:prevItem', this.handlePrevItem)
    on(document, 'global:forward', this.handleItemOpen)
    on(window, 'copy', this.handleCopy)
  }

  componentWillUnmount() {
    off(document, 'global:nextItem', this.handleNextItem)
    off(document, 'global:prevItem', this.handlePrevItem)
    off(document, 'global:forward', this.handleItemOpen)
    off(window, 'copy', this.handleCopy)
  }

  focus() {
    this.container.current?.focus()
  }

  get tabIndex() {
    return this.props.isDisabled || !this.props.items.length ?
      null : TABS[this.constructor.name]
  }

  get current() {
    return this.container.current.current
  }

  head() {
    return this.props.selection[this.props.selection.length - 1]
  }

  // Note: this can be improved, but we currently check only
  // for the first item before and after the current item. This
  // is because the worst case for weird/sparse selections is
  // not worth the price!
  after() {
    let next = this.props.items[this.container.current.next()]
    return (next == null || this.isSelected(next)) ? null : next
  }

  before() {
    let prev = this.props.items[this.container.current.prev()]
    return (prev == null || this.isSelected(prev)) ? null : prev
  }

  getSelection = () => this.props.selection

  getSelectedPhotos({ items, selection } = this.props) {
    return seq(selection, compose(
      map(id => get(items, [indexOf(items, id), 'photos'])),
      keep(),
      cat))
  }

  isSelected({ id }) {
    return this.props.selection.includes(id)
  }

  isRangeSelected(items) {
    return items.every(id => this.props.selection.includes(id))
  }

  get hasMultiSelection() {
    return this.props.selection.length > 1
  }

  clearSelection() {
    this.props.onSelect({ items: [] })
  }

  handleClickOutside = () => {
    this.clearSelection()
  }

  handleContextMenu = (event, item) => {
    let { list, selection } = this.props

    let context = ['item']
    let target = {
      id: item.id,
      photos: item.photos,
      tags: item.tags,
      list
    }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = [...selection]
      target.photos = this.getSelectedPhotos()

      if (!this.isSelected(item)) {
        target.id.push(item.id)
      }
    }

    if (this.props.isTrashSelected)
      context.push('deleted')
    else if (this.props.isReadOnly)
      context.push('read-only')
    else if (list)
      context.push('list')

    this.props.onContextMenu(event, context.join('-'), target)
  }

  handleItemDelete(items) {
    if (!(this.props.isReadOnly || blank(items))) {
      this.props.onItemDelete(items)
    }
  }

  handleCopy = () => {
    let sel = document.getSelection()
    if (sel == null || !sel.toString()) {
      this.handleItemCopy(this.props.selection)
    }
  }

  handleItemCopy(items) {
    if (!blank(items)) {
      this.props.onItemExport(items, { target: ':clipboard:' })
    }
  }

  handleItemMerge(items) {
    if (!(this.props.isReadOnly || blank(items))) {
      this.props.onItemMerge(items)
    }
  }

  handleItemOpen = async () => {
    this.props.onItemOpen(this.current)
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'open':
        this.handleItemOpen()
        break
      case 'preview':
        this.preview(this.current)
        break
      case 'clear':
        this.clearSelection()
        break
      case 'delete':
        if (!this.props.isReadOnly) {
          this.select(this.after() || this.before())
          this.handleItemDelete(this.props.selection)
        }
        break
      case 'all':
        this.props.onSelect({}, 'all')
        break
      case 'merge':
        this.handleItemMerge(this.props.selection)
        break
      case 'rotateLeft':
        this.rotate(-90)
        break
      case 'rotateRight':
        this.rotate(90)
        break
      case 'edit':
        this.edit?.(this.current)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleNextItem = (event) => {
    this.handleSelectItem(this.container.current?.next(), event)
  }

  handlePrevItem = (event) => {
    this.handleSelectItem(this.container.current?.prev(), event)
  }

  handleSelectItem = (item, event) => {
    this.select(item, {
      isMeta: event && meta(event),
      isRange: event?.shiftKey,
      throttle: event?.repeat
    })
  }

  range({ from = this.head(), to } = {}) {
    let { items } = this.props

    from = (from == null) ? 0 : indexOf(items, from)
    to = (to == null) ? items.length - 1 : indexOf(items, to)

    return (from > to) ?
      items.slice(to, from + 1).reverse() :
      items.slice(from, to + 1)
  }

  select = (item, { isMeta, isRange, throttle } = {}) => {
    if (item == null || !this.props.items.length) return
    let mod, items

    switch (true) {
      case isRange:
        mod = 'merge'
        items = this.range({ to: item.id }).map(it => it.id)
        if (this.isRangeSelected(items)) {
          mod = 'subtract'
          if (items[0] !== item.id) items.unshift(items.pop())
        }
        break

      case isMeta:
        mod = this.isSelected(item) ? 'remove' : 'append'
        items = [item.id]
        break

      default:
        if (!this.hasMultiSelection && this.isSelected(item)) return
        mod = 'replace'
        items = [item.id]
    }

    this.props.onSelect({ items }, mod, { throttle })
  }

  preview({ id, photos }) {
    this.props.onItemPreview({ id, photos })
  }

  rotate(by) {
    if (!this.props.isReadOnly && this.props.selection.length > 0) {
      this.props.onPhotoRotate({
        id: this.getSelectedPhotos(),
        by
      })
    }
  }

  connect(element) {
    return (this.isReadOnly) ?
      element :
      this.props.connectDropTarget(element)
  }

  getIterableProps(item, index) {
    return {
      item,
      index,
      photos: this.props.photos,
      tags: this.props.tags,
      isSelected: this.isSelected(item),
      isReadOnly: this.props.isReadOnly,
      isVertical: this.isVertical,
      getSelection: this.getSelection,
      onContextMenu: this.handleContextMenu,
      onDropItems: this.props.onItemMerge,
      onDropPhotos: this.props.onPhotoMove,
      onItemOpen: this.props.onItemOpen,
      onSelect: this.select
    }
  }
}
