import React from 'react'
import { TABS, SASS } from '../constants'
import { adjacent, restrict } from '../common/util'
import { has, on, off } from '../dom'
import { isMeta } from '../keymap'
import { bool, number, oneOf } from 'prop-types'
import throttle from 'lodash.throttle'

const EMPTY = []
const { ceil, floor, max, min, round } = Math


export class Iterator extends React.PureComponent {
  constructor(props) {
    super(props)
    this.viewport = { width: 0, height: 0 }
    this.state = this.getStateFromProps()
  }

  componentDidMount() {
    if (this.container != null) {
      this.update(this.props, () => {
        this.resize(this.bounds)
        this.scrollIntoView(this.current(), false)
      })

      this.ro = new ResizeObserver(([e]) => {
        this.handleResize(e.contentRect)
      })

      this.observe(this.container)
    }
  }

  componentDidUpdate(props) {
    if (props.size !== this.props.size) {
      this.scrollIntoView(this.current(), false)
    }
  }

  componentWillUnmount() {
    this.unobserve(this.container)
    if (this.ro != null) {
      this.ro.disconnect()
      this.ro = null
    }
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (this.props.size !== props.size ||
      this.getIterables(props).length !== this.size) {
      this.update(props)
    }
  }

  getStateFromProps(props = this.props) {
    const cols = this.getColumns(props.size)
    const rowHeight = this.getRowHeight(props.size)
    const rows = this.getRows({ cols }, props)
    const viewportRows = this.getViewportRows(props.size)
    const height = rows * rowHeight
    const overscan = ceil(viewportRows * props.overscan)

    let maxOffset = height - (overscan * rowHeight)
    maxOffset = max(maxOffset - (maxOffset % rowHeight), 0)

    const offset = this.getOffset({
      overscan, maxOffset, rowHeight, viewportRows
    })

    return {
      cols,
      height,
      maxOffset,
      offset,
      overscan,
      rowHeight,
      rows,
      viewportRows
    }
  }

  observe(container) {
    if (container != null) {
      if (this.handleFocus) {
        on(container, 'tab:focus', this.handleFocus)
      }

      if (this.handleScroll) {
        on(container, 'scroll', this.handleScroll, {
          capture: true, passive: true
        })
      }

      if (this.ro != null) {
        this.ro.observe(container)
      }
    }
  }

  unobserve(container) {
    if (container != null) {
      if (this.handleFocus) {
        off(container, 'tab:focus', this.handleFocus)
      }

      if (this.handleScroll) {
        off(container, 'scroll', this.handleScroll, {
          capture: true, passive: true
        })
      }

      if (this.ro != null) {
        this.ro.unobserve(container)
      }
    }
  }

  setContainer = (container) => {
    if (this.container != null) this.unobserve(this.container)
    this.container = container
    if (this.ro != null) this.observe(container)
  }

  focus = () => {
    this.container?.focus()
  }

  update(props = this.props, ...args) {
    this.setState(this.getStateFromProps(props), ...args)
  }

  get bounds() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    }
  }

  get width() {
    return this.viewport.width
  }

  get height() {
    return this.viewport.height
  }

  get isVertical() {
    return this.state.cols === 1
  }

  get isHorizontal() {
    return !this.isVertical
  }

  get isEmpty() {
    return this.size === 0
  }

  get isDisabled() {
    return this.props.isDisabled
  }

  get size() {
    return this.getIterables().length
  }

  get transform() {
    return `translate3d(0,${this.state.offset}px,0)`
  }

  get orientation() {
    return this.isVertical ? 'vertical' : 'horizontal'
  }

  get tabIndex() {
    return this.isEmpty ? null : TABS[this.constructor.name]
  }

  isLast(index) {
    return index === this.size - 1
  }

  isMapped(index) {
    if (this.mappedRange == null) return false
    if (this.mappedRange.from > index) return false
    if (this.mappedRange.to < index) return false
    return true
  }

  isIterableMapped({ id }) {
    const index = this.indexOf(id)
    return (index === -1) ? false : this.isMapped(index)
  }

  getAdjacent = (iterable) => {
    return adjacent(this.getIterables(), iterable)
  }

  getColumns(size = this.props.size) {
    return floor(this.width / this.getTileSize(size)) || 1
  }

  getIterables() {
    return EMPTY
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

  getOffset({ overscan, maxOffset, rowHeight, viewportRows } = this.state) {
    if (this.container == null) return 0

    const top = this.container.scrollTop
    const offset = floor((overscan - viewportRows) / 2) * rowHeight

    return restrict(top - (top % rowHeight) - offset, 0, maxOffset)
  }


  getRows({ cols } = this.state, props = this.props) {
    return ceil(this.getIterables(props).length / cols)
  }

  getRowHeight(size = this.props.size) {
    return this.getTileSize(size)
  }

  getViewportRows(size = this.props.size) {
    return ceil(this.height / this.getRowHeight(size))
  }

  getTileSize(size = this.props.size) {
    return round(size * SASS.TILE.FACTOR)
  }

  getIterablesPerPage() {
    return this.state.cols * this.state.viewportRows
  }

  getIterableRange() {
    const { cols, offset, overscan, rowHeight } = this.state

    const from = cols * floor(offset / rowHeight)
    const size = cols * overscan

    return {
      from, size, to: min(from + size, this.size)
    }
  }

  getIterableProps(item) {
    return item
  }

  mapIterableRange(fn, range = this.getIterableRange()) {
    const items = this.getIterables()
    const { from, to } = range

    this.mappedRange = range

    return items.slice(from, to).map((item, index) => {
      return fn(this.getIterableProps(item, from + index))
    })
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

  head() {
    throw new Error('not implemented')
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

  isSelected() {
    throw new Error('not implemented')
  }

  select() {
    throw new Error('not implemented')
  }

  range({ from = this.head(), to } = {}) {
    const items = this.getIterables()

    from = (from == null) ? 0 : this.indexOf(from)
    to = (to == null) ? this.size - 1 : this.indexOf(to)

    return (from > to) ?
      items.slice(to, from + 1).reverse() :
      items.slice(from, to + 1)
  }

  scroll(offset = 0) {
    if (this.container != null) {
      this.container.scrollTop = offset
    }
  }

  scrollBy(offset) {
    if (this.container != null) {
      this.scroll(this.container.scrollTop + offset)
    }
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
    if (item == null || this.container == null) return
    const idx = this.indexOf(item.id)
    if (idx === -1) return

    const { cols, rowHeight } = this.state
    const { height } = this
    const top = this.container.scrollTop

    let offset = floor(idx / cols) * rowHeight
    const bottom = offset + rowHeight
    const isBelow = (bottom > top)

    if (!force && isBelow && bottom <= top + height) return

    if (isBelow) {
      offset += rowHeight - height
    }

    this.scroll(offset)
  }

  handleScroll = () => {
    if (!this.isScrollUpdateScheduled) {
      this.isScrollUpdateScheduled = true

      requestAnimationFrame(() => {
        this.handleScrollUpdate()
        this.isScrollUpdateScheduled = false
      })
    }
  }

  handleScrollUpdate() {
    this.setState({ offset: this.getOffset() })
  }

  handleResize = throttle((rect) => {
    this.resize(rect)
  }, 15)

  resize(viewport) {
    this.viewport = viewport
    this.update()
  }

  handleClickOutside = (event) => {
    if (has(event.target, 'click-catcher') &&
      typeof this.clearSelection === 'function') {
      this.clearSelection()
    }
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
