import React from 'react'
import { array, bool, func, number, oneOf, string } from 'prop-types'
import { Range } from './range'
import { Runway } from './runway'
import { ScrollContainer } from './container'
import { getExpandedRows, getExpandedRowsAbove } from './expansion'
import { Viewport } from './viewport'
import { restrict } from '../../common/util'
import memoize from 'memoize-one'


export class Scroll extends React.Component {
  container = React.createRef()

  state = {
    // Derived from container size
    width: 0,
    height: 0,

    // Derived from scroll position
    offset: 0,
    row: 0,
    numRowsAbove: 0,
    expRowPosition: 0
  }

  componentDidMount() {
    this.handleResize(this.container.current.bounds)
  }

  componentDidUpdate({ itemHeight }) {
    if (itemHeight !== this.props.itemHeight)
      this.scrollIntoView()
  }

  get tabIndex() {
    return this.props.items.length === 0 ? null : this.props.tabIndex
  }

  get transform() {
    return `translate3d(0,${this.state.offset}px,0)`
  }

  sanitize(index) {
    if (index >= 0 && index < this.props.items.length)
      return index

    switch (this.props.restrict) {
      case 'wrap':
        index = index % this.props.items.length
        return (index < 0) ?
          index + this.props.items.length : index

      case 'bounds':
        return (index < 0) ? 0 : this.props.items.length - 1

      default:
        return null
    }
  }

  next(offset = 1, event) {
    if (this.props.cursor != null)
      return this.select(this.sanitize(this.props.cursor + offset), event)
    else
      return this.first()
  }

  prev(offset = 1, event) {
    if (this.props.cursor != null)
      return this.next(-offset, event)
    else
      return this.last()
  }

  first(event) {
    return this.select(
      this.props.items.length > 0 ? 0 : null,
      event
    )
  }

  last(event) {
    return this.select(
      this.props.items.length > 0 ? this.props.items.length - 1 : null,
      event
    )
  }

  pageUp(event) {
    return this.prev(this.layout.visibleItems, event)
  }

  pageDown(event) {
    return this.next(this.layout.visibleItems, event)
  }

  select(index, event) {
    if (index != null)
      this.scrollIntoView(index)

    let item = this.props.items[index]
    this.props.onSelect?.(item, event)

    return item
  }

  focus() {
    this.container.current.focus()
  }

  getComputedLayout = memoize((
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expandedItems,
    expansionPadding,
    overscan
  ) => {
    let columns = Math.floor(width / itemWidth) || 1

    let expandedRows = getExpandedRows(
      columns,
      items,
      expandedItems,
      itemWidth > 0)

    let rows = Math.ceil(items.length / columns) + expandedRows.length
    let visibleRows = Math.ceil(height / itemHeight)
    let visibleItems = visibleRows * columns
    let overscanRows = Math.max(2, Math.ceil(visibleRows * overscan))
    let rowsPerPage = visibleRows + overscanRows

    let runway = rows * itemHeight

    if (expandedItems.length > 0)
      runway += expansionPadding

    let pageOffset = Math.floor(overscanRows / 2) * itemHeight

    let maxOffset = runway - (rowsPerPage * itemHeight)
    maxOffset = Math.max(maxOffset - (maxOffset % itemHeight), 0)

    return {
      columns,
      expandedRows,
      rows,
      rowsPerPage,
      runway,
      pageOffset,
      maxOffset,
      visibleItems
    }
  })

  handleKeyDown = (event) => {
    this.props.onKeyDown?.(event)

    if (!event.isDefaultPrevented()) {

      // By default, the home, end, page up, page down and arrow keys
      // will work as expected for the ScrollContainer. If we have an
      // `onSelect` callback, however, we override the default behavior
      // of the arrow keys to select items instead of only scrolling
      // the container.

      if (this.props.onSelect) {
        let { columns } = this.layout
        let cursor = this.props.cursor ?? 0

        if (event.ctrlKey || event.metaKey)
          return

        switch (event.key) {
          case 'ArrowDown':
            if (event.altKey)
              this.last(event)
            else
              this.next(columns, event)
            break

          case 'ArrowUp':
            if (event.altKey)
              this.first(event)
            else
              this.prev(columns, event)
            break

          case 'ArrowRight':
            if (!this.props.itemWidth)
              return

            if (event.altKey)
              this.next(columns - 1 - (cursor % columns), event)
            else
              this.next(1, event)
            break

          case 'ArrowLeft':
            if (!this.props.itemWidth)
              return

            if (event.altKey)
              this.prev(cursor % columns, event)
            else
              this.prev(1, event)
            break

          default:
            return
        }

        event.preventDefault()
        event.stopPropagation()
        event.nativeEvent.stopImmediatePropagation()
      }
    }
  }

  handleResize = ({ width, height }) => {
    this.setState({ width, height }, () => {
      this.handleScroll()
    })
  }

  handleScroll = () => {
    if (!this.#scrollCallback.current) {
      this.#scrollCallback.current =
        requestAnimationFrame(this.#scrollCallback)
    }
  }

  #scrollCallback = () => {
    this.#scrollCallback.current = null
    this.handleScrollUpdate(this.container.current.scrollTop)
  }

  handleScrollUpdate(top) {
    let { itemHeight, expansionPadding } = this.props
    let { expandedRows, maxOffset, pageOffset } = this.layout

    let offset = restrict(
      top - (top % itemHeight) - pageOffset,
      0,
      maxOffset)

    let row = Math.floor(offset / itemHeight)

    let { numRowsAbove, expRowPosition } =
        getExpandedRowsAbove(expandedRows, row)

    if (expandedRows.length) {
      offset = (row - expRowPosition) * itemHeight

      if (numRowsAbove > 0 && expRowPosition === 0)
        offset += expansionPadding
    }

    this.setState({
      offset,
      row,
      numRowsAbove,
      expRowPosition
    })
  }

  handleTabFocus = (event) => {
    if (this.props.autoselect)
      this.select(this.props.cursor ?? 0)
    else
      this.scrollIntoView()

    this.props.onTabFocus?.(event)
  }

  scroll(...args) {
    this.container.current.scroll(...args)
  }

  scrollBy(...args) {
    this.container.current.scrollBy(...args)
  }

  scrollPageDown() {
    this.scrollBy(this.state.height)
  }

  scrollPageUp() {
    this.scrollBy(-this.state.height)
  }

  scrollToEnd() {
    this.scroll(this.layout.maxOffset)
  }

  scrollIntoView(index = this.props.cursor ?? 0, { force } = {}) {
    let { columns } = this.layout
    let { itemHeight } = this.props
    let { height } = this.state

    let top = this.container.current.scrollTop
    let offset = Math.floor(index / columns) * itemHeight

    // TODO adjust expansion rows and padding

    let bottom = offset + itemHeight
    let isBelow = bottom > top

    // Don't scroll if item already in viewport!
    if (!force && isBelow && bottom <= top + height)
      return

    if (isBelow)
      offset += itemHeight - height

    this.scroll(offset)
  }

  render() {
    this.layout = this.getComputedLayout(
      this.props.items,
      this.props.itemHeight,
      this.props.itemWidth,
      this.state.height,
      this.state.width,
      this.props.expandedItems,
      this.props.expansionPadding,
      this.props.overscan)

    let { columns, rowsPerPage, runway } = this.layout
    let { row, numRowsAbove } = this.state

    let from = columns * Math.max(0, row - numRowsAbove)
    let to = Math.min(from + (columns * rowsPerPage), this.props.items.length)

    return (
      <ScrollContainer
        ref={this.container}
        onClick={this.props.onClick}
        onKeyDown={this.handleKeyDown}
        onResize={this.handleResize}
        onScroll={this.handleScroll}
        onTabFocus={this.handleTabFocus}
        tabIndex={this.tabIndex}>
        <Runway height={runway}>
          <Viewport
            tag={this.props.tag}
            columns={columns}
            transform={this.transform}>
            <Range
              columns={columns}
              items={this.props.items}
              from={from}
              to={to}
              expandedItems={this.props.expandedItems}
              renderExpansionRow={this.props.renderExpansionRow}
              renderItem={this.props.children}/>
          </Viewport>
        </Runway>
      </ScrollContainer>
    )
  }

  static propTypes = {
    autoselect: bool,
    children: func.isRequired,
    cursor: number,
    expandedItems: array.isRequired,
    expansionPadding: number.isRequired,
    items: array.isRequired,
    itemWidth: number,
    itemHeight: number.isRequired,
    onClick: func,
    onKeyDown: func,
    onTabFocus: func,
    onSelect: func,
    overscan: number.isRequired,
    renderExpansionRow: func,
    restrict: oneOf(['bounds', 'wrap', 'none']).isRequired,
    tabIndex: number,
    tag: string
  }

  static defaultProps = {
    expandedItems: [],
    expansionPadding: 0,
    items: [],
    overscan: 1.25,
    restrict: 'bounds'
  }
}
