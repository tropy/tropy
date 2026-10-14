import React from 'react'
import { Range } from './range.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { getExpandedRows, getExpandedRowsAbove } from './expansion.js'
import { Viewport } from './viewport.js'
import { restrict } from '../../common/util.js'
import { indexOf } from '../../common/sequence.js'
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

  componentWillUnmount () {
    cancelAnimationFrame(this.#scrollCallback.current)
  }

  componentDidUpdate ({ cursor, itemHeight, itemWidth }, { height, width }) {
    if (cursor !== this.props.cursor ||
      itemHeight !== this.props.itemHeight)
      this.scrollIntoView()

    if (height !== this.state.height ||
      width !== this.state.width ||
      itemHeight !== this.props.itemHeight ||
      itemWidth !== this.props.itemWidth)
      this.reportLayout()
  }

  // Reports the layout as options for cursors over the items:
  // list or grid, the number of columns,
  // and the page size in items (fully visible rows times columns).
  reportLayout () {
    let { columns, isGrid } = this.layout
    let rows = Math.floor(this.state.height / this.props.itemHeight)

    this.props.onLayoutChange?.({
      layout: isGrid ? 'grid' : 'list',
      columns,
      pageSize: columns * Math.max(rows, 1)
    })
  }

  get tabIndex () {
    return this.props.items.length === 0 ? null : this.props.tabIndex
  }

  get cursor () {
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

  focus () {
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

  handleResize = ({ width, height }) => {
    this.setState({ width, height }, () => {
      this.handleScroll()
    })
    this.props.onResize?.({ width, height })
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

  handleScrollUpdate (top) {
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

    // Subtle: skip state update if no change
    // Remove check when we switch to useState!
    if (
      offset === this.state.offset &&
      row === this.state.row &&
      numRowsAbove === this.state.numRowsAbove &&
      expRowPosition === this.state.expRowPosition
    ) return

    this.setState({
      offset,
      row,
      numRowsAbove,
      expRowPosition
    })
  }

  handleFocus = (event) => {
    // The :focus-visible state survives scrolling items out of view
    // therefore we also test for relatedTarget which is typically
    // missing when the window was blurred.
    if (event?.target?.matches(':focus-visible') && event?.relatedTarget != null) {
      this.props.onTabFocus?.(event)
      this.scrollIntoView()
    }
  }

  scroll (top, left) {
    this.container.current.scrollTo({ top, left })
  }

  scrollBy (top, left) {
    this.container.current.scrollBy({ top, left })
  }

  scrollToEnd () {
    this.scroll(this.layout.maxOffset)
  }

  scrollIntoView (cursor = this.cursor, { force } = {}) {
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

  render () {
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
        className={this.state.isScrolling ? 'scrolling' : null}
        onClick={this.props.onClick}
        onKeyDown={this.props.onKeyDown}
        onResize={this.handleResize}
        onScroll={this.handleScroll}
        onScrollStart={this.handleScrollStart}
        onScrollStop={this.handleScrollStop}
        onFocus={this.handleFocus}
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

  static defaultProps = {
    expandedItems: {},
    expansionPadding: 0,
    items: [],
    overscan: 1.25
  }
}
