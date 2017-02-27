'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, node, bool, number, oneOf } = PropTypes
const cx = require('classnames')
const { bounds, on, off } = require('../dom')
const { restrict } = require('../common/util')
const { keys } = Object


const DIR = {
  top: 'row', right: 'col', bottom: 'row', left: 'col'
}

const DIM = {
  top: 'height', right: 'width', bottom: 'height', left: 'width'
}

const OPP = {
  top: 'bottom', right: 'left', bottom: 'top', left: 'right'
}

const AXS = {
  top: 'pageY', right: 'pageX', bottom: 'pageY', left: 'pageX'
}


class Resizable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value,
      isDragging: false
    }
  }

  componentWillUnmount() {
    if (this.state.isDragging) {
      this.stop()
    }
  }

  componentWillReceiveProps(props) {
    this.setState({ value: props.value })
  }

  get dimension() {
    return DIM[this.props.edge]
  }

  get value() {
    return `${this.state.value}${this.props.isRelative ? '%' : 'px'}`
  }

  get style() {
    return {
      [this.dimension]: this.value
    }
  }

  handleMouseDown = ({ button }) => {
    if (button === 0) this.start()
  }

  setContainer = (container) => {
    this.container = container
  }

  update = (event) => {
    const { edge, min, max } = this.props

    const origin = bounds(this.container)[OPP[edge]]
    const value = restrict(event[AXS[edge]] - origin, min, max)

    this.setState({ value })
  }

  start() {
    this.setState({ isDragging: true })

    on(document, 'mousemove', this.update)
    on(document, 'mouseup', this.stop, { capture: true })
    on(document, 'mouseleave', this.stop)
    on(window, 'blur', this.stop)
  }

  stop = () => {
    this.setState({ isDragging: false })

    off(document, 'mousemove', this.update)
    off(document, 'mouseup', this.stop, { capture: true })
    off(document, 'mouseleave', this.stop)
    off(window, 'blur', this.stop)

    if (this.props.value !== this.state.value) {
      //this.props.onResize(value)
      //console.log('resize', this.state.value)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return !isDisabled && (
      <div
        onMouseDown={this.handleMouseDown}
        className={cx([
          `resizable-handle-${DIR[edge]}`,
          `resizable-handle-${edge}`
        ])}/>
    )
  }

  render() {
    return (
      <div
        ref={this.setContainer}
        className="resizable"
        style={this.style}>
        {this.props.children}
        {this.renderHandle()}
      </div>
    )
  }

  static propTypes = {
    children: node,
    edge: oneOf(keys(DIM)).isRequired,
    isDisabled: bool,
    isRelative: bool,
    value: number.isRequired,
    min: number,
    max: number,
    onResize: func //.isRequired
  }

  static defaultProps = {
    min: 0
  }
}


module.exports = {
  Resizable
}
