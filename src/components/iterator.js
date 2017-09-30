'use strict'

const React = require('react')
const { PureComponent } = React
const { TABS, SASS: { TILE } } = require('../constants')
const { adjacent, times } = require('../common/util')
const { on, off } = require('../dom')
const { ceil, floor, round } = Math
const { bool, number } = require('prop-types')
const throttle = require('lodash.throttle')
const EMPTY = []


class Iterator extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      cols: 1,
      maxCols: 1,
      rows: 0,
      viewportRows: 0
    }
  }

  componentDidMount() {
    this.ro = new ResizeObserver(([e]) => {
      this.handleResize(e.contentRect)
    })

    this.ro.observe(this.container)
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    if (this.ro != null) { this.ro.disconnect() }
    off(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillReceiveProps(props) {
    if (this.props.size !== props.size ||
      this.getItems(props).length !== this.size) {
      this.update(props)
    }
  }

  update(props = this.props) {
    const cols = this.getColumns(props.size)
    const rows = this.getRows(cols, props)
    const viewportRows = this.getViewportRows(props.size)
    const rowHeight = this.getRowHeight(props.size)
    const height = rows * rowHeight
    const overflow = (viewportRows / 2) * rowHeight
    const maxCols = this.getColumns(TILE.MIN)

    let maxOffset = height - this.viewport.height
    maxOffset = maxOffset - (maxOffset % rowHeight)

    this.setState({
      cols,
      height,
      maxCols,
      maxOffset,
      overflow,
      rowHeight,
      rows,
      viewportRows
    })
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
    return this.getItems().length
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

  getAdjacent = (iterable) => {
    return adjacent(this.getItems(), iterable)
  }

  getColumns(size = this.props.size) {
    return floor(this.viewport.width / this.getTileSize(size))
  }

  getItems() {
    return EMPTY
  }

  getRows(cols = this.state.cols, props = this.props) {
    return ceil(this.getItems(props).length / cols)
  }

  getRowHeight(size = this.props.size) {
    return this.getTileSize(size)
  }

  getViewportRows(size = this.props.size) {
    return ceil(this.viewport.height / this.getRowHeight(size))
  }

  getTileSize(size = this.props.size) {
    return round(size * TILE.FACTOR)
  }

  setContainer = (container) => {
    this.container = container
  }

  fill(count = this.state.maxCols, key = 'filler') {
    return times(count, (i) => (
      <li key={`${key}-${i}`} className="filler tile"/>
    ))
  }

  fillRow() {
    if (this.filler == null || this.filler.length !== this.state.maxCols) {
      this.filler = this.fill()
    }

    return this.filler
  }

  handleResize = throttle((viewport) => {
    this.viewport = viewport
    this.update()
  }, 15)

  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    size: number.isRequired
  }
}

module.exports = {
  Iterator
}
