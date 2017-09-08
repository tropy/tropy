'use strict'

const React = require('react')
const { PureComponent } = React
const { TABS, SASS: { TILE } } = require('../constants')
const { adjacent, times } = require('../common/util')
const { ceil, floor } = Math
const { bool, number } = require('prop-types')
const throttle = require('lodash.throttle')


class Iterator extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      cols: 1, maxCols: 1
    }
  }

  componentDidMount() {
    if (this.isGrid) {
      this.ro = new ResizeObserver(([e]) => {
        this.handleResize(e.contentRect)
      })

      this.ro.observe(this.container)
    }
  }

  componentWillUnmount() {
    if (this.ro != null) {
      this.ro.disconnect()
    }
  }

  componentWillReceiveProps(props) {
    if (this.isGrid) {
      if (this.props.size !== props.size) {
        this.setState({
          cols: this.getColumns(props.size)
        })
      }
    }
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
    return this.iteration != null ? this.iteration.length : 0
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
    return adjacent(this.iteration, iterable)
  }

  getColumns(size = this.props.size, width = this.width) {
    return floor(width / ceil(size * TILE.FACTOR))
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


  handleResize = throttle(({ width }) => {
    this.width = width
    this.setState({
      cols: this.getColumns(),
      maxCols: this.getColumns(TILE.MIN)
    })
  }, 20)


  get isGrid() {
    return this.constructor.isGrid
  }

  static get isGrid() {
    return false
  }

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
