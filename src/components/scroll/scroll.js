import React from 'react'
import { array, func, number, string } from 'prop-types'
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
    width: 0,
    height: 0,
    offset: 0,
    row: 0,
    numRowsAbove: 0,
    numOffsetRows: 0
  }

  componentDidMount() {
    this.handleResize(this.container.current.bounds, () => {
      this.handleScrollUpdate(this.container.current.scrollTop)
    })
  }

  get tabIndex() {
    return this.props.items.length === 0 ? null : this.props.tabIndex
  }

  get transform() {
    return `translate3d(0,${this.state.offset}px,0)`
  }

  focus() {
    this.container.current.focus()
  }

  updateComputedLayout() {
    this.layout = this.getComputedLayout(
      this.props.items,
      this.props.itemHeight,
      this.props.itemWidth,
      this.state.height,
      this.state.width,
      this.props.expanded,
      this.props.expansionPadding,
      this.props.overscan)
  }

  getComputedLayout = memoize((
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expanded,
    expansionPadding,
    overscan
  ) => {
    let columns = Math.floor(width / itemWidth) || 1

    let expandedRows = getExpandedRows(
      columns,
      items,
      expanded,
      itemWidth > 0)

    let rows = Math.ceil(items.length / columns) + expandedRows.length
    let rowsPerPage = Math.ceil(height / itemHeight)
    let runway = rows * itemHeight

    if (expandedRows.length > 0)
      runway += (expansionPadding * expandedRows.length)

    let maxOffset = runway - (overscan * itemHeight)
    maxOffset = Math.max(maxOffset - (maxOffset % itemHeight), 0)

    return {
      columns,
      expandedRows,
      rows,
      rowsPerPage,
      overscan: Math.ceil(rowsPerPage * overscan),
      runway,
      maxOffset
    }
  })

  handleResize = ({ width, height }, callback) => {
    this.setState({ width, height }, callback)
  }

  handleScroll = () => {
    if (!this.scrollCallbackId) {
      this.scrollCallbackId = requestAnimationFrame(() => {
        this.handleScrollUpdate(this.container.current.scrollTop)
        this.scrollCallbackId = null
      })
    }
  }

  handleScrollUpdate(top) {
    let { items, itemHeight, expansionPadding } = this.props
    let {
      columns, expandedRows, overscan, maxOffset, rowsPerPage
    } = this.layout


    let offset = Math.floor((overscan - rowsPerPage) / 2) * itemHeight
    offset = restrict(top - (top % itemHeight) - offset, 0, maxOffset)

    let row = Math.floor(offset / itemHeight)

    let { numRowsAbove, numOffsetRows } =
        getExpandedRowsAbove(expandedRows, row)

    if (expandedRows.length) {
      offset = (row - numOffsetRows) * itemHeight

      if (numRowsAbove > 0 && numOffsetRows === 0)
        offset += expansionPadding
    }

    this.setState({
      offset,
      row,
      numRowsAbove,
      numOffsetRows
    })
  }

  pageUp() {
    this.scrollBy(-this.state.height)
  }

  pageDown() {
    this.scrollBy(this.state.height)
  }

  toEnd() {
    this.scroll(this.layout.runway - this.state.height)
  }

  scroll(...args) {
    this.container.current.scroll(...args)
  }

  scrollBy(...args) {
    this.container.current.scroll(...args)
  }

  scrollIntoView(idx, { force } = {}) {
    let { columns } = this.layout
    let { itemHeight } = this.props
    let { height } = this.state

    let top = this.container.current.scrollTop
    let offset = Math.floor(idx / columns) * itemHeight

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
    this.updateComputedLayout()

    let { items } = this.props
    let { columns, expandedRows, overscan, runway } = this.layout
    let { row, numRowsAbove } = this.state

    let from = columns * (row - numRowsAbove)
    let to = Math.min(from + (columns * overscan), items.length)

    return (
      <ScrollContainer
        ref={this.container}
        onClick={this.props.onClick}
        onKeyDown={this.props.onKeyDown}
        onResize={this.handleResize}
        onScroll={this.handleScroll}
        onTabFocus={this.props.onTabFocus}
        tabIndex={this.tabIndex}>
        <Runway height={runway}>
          <Viewport
            tag={this.props.tag}
            columns={columns}
            transform={this.transform}>
            <Range
              columns={columns}
              isExpanded={expandedRows.length > 0}
              items={items}
              from={from}
              to={to}
              mapper={this.props.children}/>
          </Viewport>
        </Runway>
      </ScrollContainer>
    )
  }

  static propTypes = {
    children: func.isRequired,
    expanded: array.isRequired,
    expansionPadding: number.isRequired,
    items: array.isRequired,
    itemWidth: number,
    itemHeight: number.isRequired,
    onClick: func,
    onKeyDown: func,
    onTabFocus: func,
    overscan: number.isRequired,
    tabIndex: number,
    tag: string
  }

  static defaultProps = {
    expanded: [],
    expansionPadding: 0,
    items: [],
    overscan: 1.25
  }
}
