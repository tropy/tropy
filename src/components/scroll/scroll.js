import React from 'react'
import { array, func, number, oneOf } from 'prop-types'
import { Range } from './range'
import { Runway } from './runway'
import { ScrollContainer } from './container'
import { Viewport } from './viewport'
import memoize from 'memoize-one'


export class Scroll extends React.Component {
  container = React.createRef()
  range = React.createRef()

  state = {
    width: 0,
    height: 0,
    offset: 0
  }

  static getComputedLayout(
    size, itemWidth, itemHeight, width, height, overscan, layout
  ) {
    let columns = (layout === 'grid') ?  Math.floor(width / itemWidth) : 1
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
  }

  componentDidMount() {
    // this.handleResize(this.container.current.bounds)
  }

  get layout() {
    return this.getComputedLayout(
      this.props.items.length,
      this.props.itemWidth,
      this.props.itemHeight,
      this.state.width,
      this.state.height,
      this.props.overscan,
      this.props.layout
    )
  }

  getComputedLayout = memoize(Scroll.getComputedLayout)

  getRange(offset, size, columns, overscan, itemHeight) {
    let from = columns * Math.floor(offset / itemHeight)

    return {
      from,
      to: Math.min(from + (columns * overscan), size)
    }
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

  handleResize = ({ width, height }) => {
    this.setState({ width, height })
  }

  handleScroll = () => {
  }

  scrollIntoView(item, force = true) {
  }

  render() {
    let { columns, overscan, runwayHeight } = this.layout
    let { from, to } = this.getRange(
      this.state.offset,
      this.props.items.length,
      columns,
      overscan,
      this.props.itemHeight)

    return (
      <ScrollContainer
        ref={this.container}
        onClick={this.props.onClick}
        onKeyDown={this.props.onKeyDown}
        onResize={this.handleResize}
        onScroll={this.handleScroll}
        onTabFocus={this.handleScroll}
        tabIndex={this.tabIndex}>
        <Runway height={runwayHeight}>
          <Viewport
            tag={this.props.layout === 'table' ? 'div' : 'ul'}
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
    layout: oneOf(['list', 'grid', 'table']),
    onClick: func,
    onKeyDown: func,
    overscan: number.isRequired,
    tabIndex: number
  }

  static defaultProps = {
    items: [],
    layout: 'list',
    overscan: 1.25
  }
}
