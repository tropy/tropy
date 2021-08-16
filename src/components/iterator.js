import React from 'react'
import { TABS } from '../constants'
import { isMeta } from '../keymap'
import { bool, number, oneOf } from 'prop-types'


export class Iterator extends React.PureComponent {
  container = React.createRef()

  state = {}

  componentDidUpdate(props) {
    if (props.size !== this.props.size) {
      this.scrollIntoView(this.current(), false)
    }
  }

  focus = () => {
    this.container.current.focus()
  }

  get isVertical() {
    return this.container.current?.layout.columns === 1
  }

  get isHorizontal() {
    return !this.isVertical
  }

  get isDisabled() {
    return this.props.isDisabled
  }

  get size() {
    return this.getIterables().length
  }

  get tabIndex() {
    return this.size === 0 ? null : TABS[this.constructor.name]
  }

  getIterableAt(idx, items = this.getIterables(), mode = this.props.restrict) {
    if (idx < 0 || idx >= items.length) {
      switch (mode) {
        case 'none':
          return null
        case 'wrap':
          idx = idx % items.length
          if (idx < 0) idx = items.length + idx
          break
        default:
          idx = idx < 0 ? 0 : items.length - 1
          break
      }
    }

    return items[idx]
  }

  getIterablesPerPage() {
    return this.state.cols * this.state.viewportRows
  }

  indexOf(id, props = this.props) {
    const items = this.getIterables(props)
    return (items.idx != null) ?
      items.idx[id] :
      items.findIndex(it => it.id === id)
  }

  next(offset = 1, mode = this.props.restrict) {
    const items = this.getIterables()
    if (!items.length) return null

    const head = this.head()
    if (head == null) {
      return (offset < 0) ? items[items.length - 1] : items[0]
    }

    const idx = this.indexOf(head)
    if (idx == null || idx < 0) {
      return (offset > 0) ? items[0] : items[items.length - 1]
    }

    return this.getIterableAt(idx + offset, items, mode)
  }

  prev(offset = 1, mode = this.props.restrict) {
    return this.next(-offset, mode)
  }

  current() {
    return this.next(0)
  }

  first() {
    return this.getIterables()[0]
  }

  last() {
    const items = this.getIterables()
    return items[items.length - 1]
  }

  pageDown() {
    return this.next(this.getIterablesPerPage(), 'bounds')
  }

  pageUp() {
    return this.prev(this.getIterablesPerPage(), 'bounds')
  }

  scroll(offset = 0) {
    this.container.current?.scroll(offset)
  }

  scrollBy(offset) {
    this.container.current?.scrollBy(offset)
  }

  scrollPageUp() {
    this.scrollBy(-this.height)
  }

  scrollPageDown() {
    this.scrollBy(this.height)
  }

  scrollToEnd() {
    this.scroll(this.state.height - this.height)
  }

  scrollIntoView(item = this.current(), force = true) {
    if (item == null || this.container.current == null) return
    const idx = this.indexOf(item.id)
    if (idx === -1) return
    this.container.current.scrollIntoView(idx, { force })
  }

  handleClickOutside = () => {
    if (typeof this.clearSelection === 'function')
      this.clearSelection()
  }

  handleFocus = () => {
    const item = this.current()
    if (item == null) return

    if (this.isSelected(item)) {
      this.scrollIntoView(item, false)
    } else {
      this.select(item, { scrollIntoView: true })
    }
  }

  handlePageDown(event = {}) {
    if (event.shiftKey || isMeta(event)) {
      this.select(this.pageDown(), {
        isRange: event.shiftKey,
        scrollIntoView: true,
        throttle: true
      })
    } else {
      this.scrollPageDown()
    }
  }

  handlePageUp(event = {}) {
    if (event.shiftKey || isMeta(event)) {
      this.select(this.pageUp(), {
        isRange: event.shiftKey,
        scrollIntoView: true,
        throttle: true
      })
    } else {
      this.scrollPageUp()
    }
  }

  handleHomeKey(event = {}) {
    if (event.shiftKey || isMeta(event)) {
      this.select(this.first(), {
        isRange: event.shiftKey,
        scrollIntoView: true,
        throttle: true
      })
    } else {
      this.scroll(0)
    }
  }

  handleEndKey(event = {}) {
    if (event.shiftKey || isMeta(event)) {
      this.select(this.last(), {
        isRange: event.shiftKey,
        scrollIntoView: true,
        throttle: true
      })
    } else {
      this.scrollToEnd()
    }
  }

  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    overscan: number.isRequired,
    restrict: oneOf(['bounds', 'wrap', 'none']).isRequired,
    size: number
  }

  static defaultProps = {
    overscan: 1.25,
    restrict: 'bounds'
  }
}
