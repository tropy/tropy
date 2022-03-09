import React from 'react'
import { array, bool, func, number, object, oneOf, string } from 'prop-types'
import { Range } from './range'
import { Runway } from './runway'
import { ScrollContainer } from './container'
import { getExpandedRows, getExpandedRowsAbove } from './expansion'
import { Viewport } from './viewport'
import { restrict } from '../../common/util'
import { indexOf, sanitize } from '../../common/collection'
import memoize from 'memoize-one'


export class Scroll extends React.Component {
  container = React.createRef()

  state = {
    isScrolling: false,

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

  componentWillUnmount() {
    cancelAnimationFrame(this.#scrollCallback.current)
  }

  componentDidUpdate({ itemHeight }) {
    if (itemHeight !== this.props.itemHeight)
      this.scrollIntoView()
  }

  get tabIndex() {
    return this.props.items.length === 0 ? null : this.props.tabIndex
  }

  get cursor() {
    let { cursor, items, expansionCursor, expandedItems } = this.props

    let index = indexOf(items, cursor)
    let expRowPosition = 0

    if (expansionCursor != null) {
      let expIndex = expandedItems[cursor]?.indexOf(expansionCursor)

      if (expIndex != null && expIndex >= 0)
        expRowPosition = expIndex + 1
    }

    return [index, expRowPosition]
  }

  get current() {
    return this.next(0)
  }

  next(k = 1) {
    let [cursor, expRowPosition] = this.cursor

    if (cursor === -1)
      return (k < 0) ? this.last() : this.first()

    let { expandedRows, isGrid } = this.layout
    let { numRowsAbove } =
      getExpandedRowsAbove(expandedRows, { index: cursor })

    let row = cursor + k
    let len = this.props.items.length

    if (!isGrid) {
      row += numRowsAbove + expRowPosition
      len += expandedRows.length
    }

    row = sanitize(len, row, this.props.restrict)

    if (row == null)
      return null

    if (isGrid)
      return this.props.items[row]

    let nxt = getExpandedRowsAbove(expandedRows, { position: row })
    let item = this.props.items[row - nxt.numRowsAbove]

    if (nxt.expRowPosition) {
      // TODO selection name!
      let selection = item.selections[nxt.expRowPosition - 1]
      return { ...item, selection }
    }

    return item
  }

  prev(k = 1) {
    return this.next(-k)
  }

  first() {
    return this.props.items[0]
  }

  last() {
    let { items, expandedItems } = this.props
    let { isGrid } = this.layout
    let item = items[items.length - 1]
    let expansion = expandedItems[item.id]

    // TODO selection name!
    if (!isGrid && expansion) {
      let selection = expansion[expansion.length - 1]
      return { ...item, selection }
    }

    return item
  }

  range({ from, to } = {}) {
    // TODO handle expansions!
    let { items } = this.props

    if (from == null) {
      let [cursor] = this.cursor
      from = Math.max(0, cursor)
    } else {
      from = indexOf(items, from)
    }

    to = (to == null) ? items.length - 1 : indexOf(items, to)

    return (from > to) ?
      items.slice(to, from + 1).reverse() :
      items.slice(from, to + 1)
  }

  pageUp() {
    let { items, itemHeight } = this.props
    let { columns } = this.layout

    this.scrollPageUp()

    let offset = this.container.current.scrollTop
    let row = Math.floor(offset / itemHeight)

    // TODO handle list expansions
    // TODO account for expansion padding

    return items[row * columns]
  }

  pageDown() {
    let { items, itemHeight } = this.props
    let { columns } = this.layout

    this.scrollPageDown()

    let top = this.container.current.scrollTop
    let offset = top + this.state.height - itemHeight
    let row = Math.floor(offset / itemHeight)

    // TODO handle list expansions
    // TODO account for expansion padding

    return items[row * columns]
  }

  select(item, event) {
    if (item != null)
      this.scrollIntoView(item)

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
    let isGrid = itemWidth > 0

    let expandedRows = getExpandedRows(
      columns,
      items,
      expandedItems,
      isGrid)

    let rows = Math.ceil(items.length / columns) + expandedRows.length
    let visibleRows = Math.ceil(height / itemHeight)
    let visibleItems = visibleRows * columns
    let overscanRows = Math.max(2, Math.ceil(visibleRows * overscan))
    let rowsPerPage = visibleRows + overscanRows

    let runway = rows * itemHeight

    if (expandedRows.length > 0)
      runway += expansionPadding

    let pageOffset = Math.floor(overscanRows / 2) * itemHeight

    let maxOffset = runway - (rowsPerPage * itemHeight)
    maxOffset = Math.max(maxOffset - (maxOffset % itemHeight), 0)

    return {
      columns,
      expandedRows,
      isGrid,
      rows,
      rowsPerPage,
      runway,
      pageOffset,
      maxOffset,
      visibleItems
    }
  })

  handleKeyDown = (event) => {
    // By default, the home, end, page up, page down and arrow keys
    // will work as expected for the ScrollContainer. If we have an
    // `onSelect` callback, however, we override the default behavior
    // of the arrow keys to select items instead of only scrolling
    // the container.
    if (this.props.onSelect)
      this.handleArrowKeys(event)

    if (!event.isDefaultPrevented()) {
      this.props.onKeyDown?.(event)
    }
  }

  // eslint-disable-next-line complexity
  handleArrowKeys(event) {
    if (event.ctrlKey || event.metaKey)
      return

    let { items } = this.props
    let { columns, isGrid } = this.layout
    let [cursor] = this.cursor

    if (cursor === -1) ++cursor

    if (isGrid && this.props.restrict === 'bounds') {
      var isFirstRow = cursor < columns
      var isLastRow =
        cursor >= (items.length - ((items.length % columns) || columns))
    }

    switch (event.key) {
      case 'ArrowDown':
        if (event.altKey)
          this.select(this.last(), event)
        else {
          if (!isLastRow)
            this.select(this.next(columns), event)
        }
        break

      case 'ArrowUp':
        if (event.altKey)
          this.select(this.first(), event)
        else {
          if (!isFirstRow)
            this.select(this.prev(columns), event)
        }
        break

      case 'ArrowRight':
        if (!isGrid)
          return

        if (event.altKey)
          this.select(this.next(columns - 1 - (cursor % columns)), event)
        else
          this.select(this.next(), event)
        break

      case 'ArrowLeft':
        if (!isGrid)
          return

        if (event.altKey)
          this.select(this.prev(cursor % columns), event)
        else
          this.select(this.prev(), event)
        break

      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleResize = ({ width, height }) => {
    this.setState({ width, height }, () => {
      this.handleScroll()
    })
  }

  handleScrollStart = () => {
    this.setState({ isScrolling: true })
  }

  handleScrollStop = () => {
    this.setState({ isScrolling: false })
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
        getExpandedRowsAbove(expandedRows, { position: row })

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
      this.select(this.current)
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

  scrollIntoView(cursor = this.cursor, { force } = {}) {
    let expRowPosition = 0

    if (Array.isArray(cursor)) {
      expRowPosition = cursor[1]
      cursor = cursor[0]
    }

    if (cursor != null && typeof cursor === 'object')
      cursor = indexOf(this.props.items, cursor.id)

    if (cursor == null || cursor < 0)
      return

    let { columns, expandedRows, isGrid } = this.layout
    let { itemHeight, expansionPadding } = this.props
    let { height } = this.state

    let top = this.container.current.scrollTop
    let row = Math.floor(cursor / columns)

    let { numRowsAbove } =
        getExpandedRowsAbove(expandedRows, { index: row })

    let offset = (row + numRowsAbove + expRowPosition) * itemHeight

    if (isGrid && numRowsAbove > 0)
      offset += expansionPadding

    let bottom = offset + itemHeight
    let isBelow = bottom > top

    // Don't scroll if item already in viewport!
    if (!force && isBelow && bottom <= top + height)
      return

    if (isBelow)
      offset += itemHeight - height

    this.scroll(offset)
  }

  sync(...args) {
    this.container.current.sync(...args)
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
        sync={this.props.sync}
        onClick={this.props.onClick}
        onKeyDown={this.handleKeyDown}
        onResize={this.handleResize}
        onScroll={this.handleScroll}
        onScrollStart={this.handleScrollStart}
        onScrollStop={this.handleScrollStop}
        onTabFocus={this.handleTabFocus}
        tabIndex={this.tabIndex}>
        <Runway height={runway}>
          <Viewport
            tag={this.props.tag}
            columns={columns}
            offset={this.state.offset}>
            <Range
              isScrolling={this.state.isScrolling}
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
    expandedItems: object.isRequired,
    expansionPadding: number.isRequired,
    expansionCursor: number,
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
    sync: object,
    tabIndex: number,
    tag: string
  }

  static defaultProps = {
    expandedItems: {},
    expansionPadding: 0,
    items: [],
    overscan: 1.25,
    restrict: 'bounds'
  }
}
