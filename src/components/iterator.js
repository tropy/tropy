'use strict'

const React = require('react')
const { PureComponent } = React
const { TABS, SASS: { TILE, SCROLLBAR } } = require('../constants')
const { bounds } = require('../dom')
const { times } = require('../common/util')
const { win } = require('../window')
const { floor } = Math
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
    if (this.constructor.isGrid) {
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
    if (this.constructor.isGrid) {
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
    return this.iteration.length
  }

  get orientation() {
    return this.isVertical ? 'vertical' : 'horizontal'
  }

  get tabIndex() {
    return this.isEmpty ? null : TABS[this.constructor.name]
  }

  getColumns(size = this.props.size, width = this.width) {
    if (win.state.scrollbars) {
      width = width - SCROLLBAR.WIDTH
    }

    return floor(width / (size * TILE.FACTOR))
  }

  setContainer = (container) => {
    this.container = container
  }

  fill(count) {
    return times(count, (i) => (
      <li key={`filler-${i}`} className="filler tile"/>
    ))
  }

  handleResize = throttle(({ width }) => {
    this.width = width
    const maxCols = this.getColumns(TILE.MIN)

    this.setState({
      cols: this.getColumns(), maxCols
    })

    if (this.constructor.isGrid) {
      this.filler = this.fill(maxCols)
    }
  }, 20)


  static get isGrid() {
    return false
  }

  static get props() {
    return Object.keys(this.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    size: number.isRequired
  }
}

module.exports = {
  Iterator
}
