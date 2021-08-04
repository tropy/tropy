import React from 'react'
import { array, func, number, string } from 'prop-types'
import { Range } from './range'
import { Runway } from './runway'
import { ScrollContainer } from './container'
import { Viewport } from './viewport'
import { restrict } from '../../common/util'
import memoize from 'memoize-one'


export class Scroll extends React.Component {
  container = React.createRef()
  range = React.createRef()

  state = {
    width: 0,
    height: 0,
    offset: 0
  }

  componentDidMount() {
    this.handleResize(this.container.current.bounds)
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

  getComputedLayout = memoize((
    size,
    itemWidth,
    itemHeight,
    width,
    height,
    overscan
  ) => {
    let columns = (itemWidth != null) ?  Math.floor(width / itemWidth) : 1
    let rows = Math.ceil(size / columns)
    let rowsPerPage = Math.ceil(height / itemHeight)
    let runway = rows * itemHeight

    let maxOffset = runway - (overscan * itemHeight)
    maxOffset = Math.max(maxOffset - (maxOffset % itemHeight), 0)

    return {
      columns,
      rows,
      rowsPerPage,
      overscan: Math.ceil(rowsPerPage * overscan),
      runway,
      maxOffset
    }
  })

  getOffset() {
    let { itemHeight } = this.props
    let { overscan, maxOffset, rowsPerPage } = this.layout

    if (!this.container.current)
      return 0

    let top = this.container.current.scrollTop
    let offset = Math.floor((overscan - rowsPerPage) / 2) * itemHeight

    return restrict(top - (top % itemHeight) - offset, 0, maxOffset)
  }

  getRange(
    offset = this.state.offset,
    size = this.props.items.length,
    columns = this.layout.columns,
    overscan = this.layout.overscan,
    itemHeight = this.props.itemHeight
  ) {
    let from = columns * Math.floor(offset / itemHeight)

    return {
      from,
      to: Math.min(from + (columns * overscan), size)
    }
  }

  handleResize = ({ width, height }) => {
    this.setState({ width, height })
  }

  handleScroll = () => {
    if (!this.scrollCallbackId) {
      this.scrollCallbackId = requestAnimationFrame(() => {
        this.setState({
          offset: this.getOffset()
        })
        this.scrollCallbackId = null
      })
    }
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

    let bottom = offset + itemHeight
    let isBelow = bottom > top

    // No scroll if item already in viewport
    if (!force && isBelow && bottom <= top + height)
      return

    if (isBelow)
      offset += itemHeight - height

    this.scroll(offset)
  }

  render() {
    this.layout = this.getComputedLayout(
      this.props.items.length,
      this.props.itemWidth,
      this.props.itemHeight,
      this.state.width,
      this.state.height,
      this.props.overscan)

    let { from, to } = this.getRange()
    let { columns, runway } = this.layout

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
              ref={this.range}
              items={this.props.items}
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
    items: [],
    overscan: 1.25
  }
}
