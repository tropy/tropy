'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget, NativeTypes } = require('../dnd')
const { DND } = require('../../constants')
const { isImageSupported } = require('../../constants/mime')
const { FormattedMessage } = require('react-intl')
const { match, isMeta: meta } = require('../../keymap')
const cx = require('classnames')
const { blank, get } = require('../../common/util')
const { on, off } = require('../../dom')
const { seq, compose, map, cat, keep } = require('transducers.js')
const { extname } = require('path')

const {
  arrayOf, shape, bool, func, number, object, string
} = require('prop-types')


class ItemIterator extends Iterator {

  componentDidMount() {
    super.componentDidMount()
    on(document, 'global:next-item', this.handleNextItem)
    on(document, 'global:prev-item', this.handlePrevItem)
    on(document, 'global:forward', this.handleItemOpen)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    off(document, 'global:next-item', this.handleNextItem)
    off(document, 'global:prev-item', this.handlePrevItem)
    off(document, 'global:forward', this.handleItemOpen)
  }

  get classes() {
    return {
      'over': this.props.isOver,
      'over-file': this.props.isOverFile,
      'dragging': this.state.isDragging,
      'drop-target': !this.props.isDisabled
    }
  }

  get tabIndex() {
    return this.props.isActive ? super.tabIndex : null
  }

  getIterables(props = this.props) {
    return props.items || super.getIterables()
  }

  head() {
    const { selection } = this.props
    return selection.length > 0 ? selection[selection.length - 1] : null
  }

  // Note: this can be improved, but we currently check only
  // for the first item before and after the current item. This
  // is because the worst case for weird/sparse selections is
  // not worth the price!
  after() {
    const next = this.next()
    return (next == null || this.isSelected(next)) ? null : next
  }

  before() {
    const prev = this.prev()
    return (prev == null || this.isSelected(prev)) ? null : prev
  }

  getSelection = () => this.props.selection

  getSelectedPhotos({ items, selection } = this.props) {
    return seq(selection, compose(
        map(id => get(items, [this.indexOf(id), 'photos'])),
        keep(),
        cat))
  }

  isItemSortable() {
    return this.hasPositionColumn() && this.props.sort.column === 'added'
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

  handleContextMenu = (event, item) => {
    let { list, isDisabled, selection, onContextMenu } = this.props

    let context = ['item']
    let target = {
      id: item.id, photos: item.photos, tags: item.tags, list
    }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = [...selection]
      target.photos = this.getSelectedPhotos()

      if (!this.isSelected(item)) {
        target.id.push(item.id)
      }
    }

    if (list) context.push('list')
    if (isDisabled) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  handleDragStart = () => {
    this.setState({ isDragging: true })
  }

  handleDragStop = () => {
    this.setState({ isDragging: false })
  }

  handleItemDelete(items) {
    if (!(this.props.isDisabled || blank(items))) {
      this.props.onItemDelete(items)
    }
  }

  handleItemCopy(items) {
    if (!(this.props.isDisabled || blank(items))) {
      this.props.onItemExport(items, { target: ':clipboard:' })
    }
  }

  handleItemMerge(items) {
    if (!(this.props.isDisabled || blank(items))) {
      this.props.onItemMerge(items)
    }
  }

  handleItemOpen = async () => {
    this.props.onItemOpen(this.current())
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.handlePrevItem(event)
        break
      case (this.isVertical ? 'down' : 'right'):
        this.handleNextItem(event)
        break
      case 'home':
        this.handleHomeKey(event)
        break
      case 'end':
        this.handleEndKey(event)
        break
      case 'pageUp':
        this.handlePageUp(event)
        break
      case 'pageDown':
        this.handlePageDown(event)
        break
      case 'open':
        this.handleItemOpen()
        break
      case 'preview':
        this.preview(this.current())
        break
      case 'clear':
        this.clearSelection()
        break
      case 'delete':
        this.select(this.after() || this.before())
        this.handleItemDelete(this.props.selection)
        break
      case 'all':
        this.props.onSelect({}, 'all')
        break
      case 'copy':
        this.handleItemCopy(this.props.selection)
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
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleNextItem = (event) => {
    this.handleSelectItem(this.next(), event)
  }

  handlePrevItem = (event) => {
    this.handleSelectItem(this.prev(), event)
  }

  handleSelectItem(item, event) {
    this.select(item, {
      isMeta: meta(event),
      isRange: event.shiftKey,
      scrollIntoView: true,
      throttle: true
    })
  }

  select = (item, { isMeta, isRange, scrollIntoView, throttle } = {}) => {
    if (item == null || this.size === 0) return
    let mod, items

    if (scrollIntoView) {
      this.scrollIntoView(item, false)
    }

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
    if (!this.props.isDisabled && this.props.selection.length > 0) {
      this.props.onPhotoRotate({
        id: this.getSelectedPhotos(),
        by
      })
    }
  }

  connect(element) {
    return (this.isDisabled) ? element : this.props.dt(element)
  }

  getIterableProps(item, index) {
    return {
      item,
      index,
      cache: this.props.cache,
      photos: this.props.photos,
      tags: this.props.tags,
      isItemSortable: this.isItemSortable(),
      isLast: this.isLast(index),
      isSelected: this.isSelected(item),
      isDisabled: this.isDisabled,
      isVertical: this.isVertical,
      getSelection: this.getSelection,
      onContextMenu: this.handleContextMenu,
      onDropItems: this.props.onItemMerge,
      onDropPhotos: this.props.onPhotoMove,
      onItemOpen: this.props.onItemOpen,
      onItemOrder: this.props.onItemOrder,
      onPhotoError: this.props.onPhotoError,
      onSelect: this.select
    }
  }

  renderNoItems() {
    return this.connect(
      <div className={
        cx('no-items', 'drop-target', { over: this.props.isOver })
      }>
        <figure className="no-items-illustration"/>
        <h1><FormattedMessage id="project.empty"/></h1>
      </div>
    )
  }

  hasPositionColumn(props = this.props) {
    return !!props.list
  }

  static asDropTarget() {
    return DropTarget(
        [DND.ITEMS, NativeTypes.FILE],
        DropTargetSpec,
        DropTargetCollect
      )(this)
  }

  static propTypes = {
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired,

    sort: shape({
      asc: bool,
      column: string.isRequired
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
    onItemImport: func.isRequired,
    onItemExport: func.isRequired,
    onItemMerge: func.isRequired,
    onItemOpen: func.isRequired,
    onItemOrder: func.isRequired,
    onItemPreview: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoMove: func.isRequired,
    onPhotoRotate: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired
  }
}

const DropTargetSpec = {
  drop({ list, onItemImport }, monitor) {
    let type = monitor.getItemType()
    let item = monitor.getItem()
    let files

    switch (type) {
      case NativeTypes.FILE:
        files = item.files.filter(isImageSupported).map(f => f.path)
        break
      case NativeTypes.URL:
        files = item.urls.filter(url => isImageSupported(extname(url)))
        break
    }

    if (!blank(files)) {
      onItemImport({ files, list })
      return { files }
    }
  },

  canDrop({ items }, monitor) {
    let type = monitor.getItemType()
    let item = monitor.getItem()

    switch (type) {
      case DND.ITEMS:
        return items.length > 1
      case NativeTypes.FILE:
        return !!item.types.find(isImageSupported)
      case NativeTypes.URL:
        return true
      default:
        return false
    }
  }
}

const DropTargetCollect = (connect, monitor) => {
  let isOver = monitor.isOver({ shallow: true }) && monitor.canDrop()
  let type = monitor.getItemType()

  return {
    dt: connect.dropTarget(),
    isOverFile: isOver && type === NativeTypes.FILE,
    isOver: isOver && type === DND.ITEMS
  }
}

module.exports = {
  ItemIterator
}
