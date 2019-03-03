'use strict'

const React = require('react')
const { func, node, bool, number, oneOf, string } = require('prop-types')
const { Draggable } = require('./draggable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { capitalize, noop, restrict } = require('../common/util')
const { round } = require('../common/math')
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


class Resizable extends React.Component {
  state = {
    isResizing: false
  }

  get classes() {
    return ['resizable', this.props.className, {
      disabled: this.props.isDisabled,
      resizing: this.state.isResizing
    }]
  }

  get dimension() {
    return DIM[this.props.edge]
  }

  get value() {
    return this.props.isBuffered && this.state.isResizing ?
      this.state.value :
      restrict(this.props.value, this.props.min, this.props.max)
  }

  get cssValue() {
    return `${this.value}${this.props.isRelative ? '%' : 'px'}`
  }

  get cssMin() {
    return `${this.props.min}px`
  }

  get cssMax() {
    return this.props.max ? `${this.props.max}px` : null
  }

  get style() {
    let { cssValue, cssMax, cssMin, dimension } = this
    return {
      [dimension]: cssValue,
      [`min${capitalize(dimension)}`]: cssMin,
      [`max${capitalize(dimension)}`]: cssMax
    }
  }

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  getNewValue(event) {
    let { edge, min, isRelative } = this.props
    let { isInverse, origin, scale, max } = this

    let value = restrict(
      (event[AXS[edge]] - origin) * (isInverse ? -1 : 1), min, max
    )

    return (!isRelative) ? { value } : {
      absolute: value,
      value: restrict(round(value / scale, 100), null, 100)
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handleDragStart = (event) => {
    let { edge, onDragStart, isRelative, value, margin, max } = this.props
    let dist = bounds(this.container.parentElement)[DIM[edge]]

    this.max = margin ? restrict(dist - margin, this.props.min) : max
    this.scale = dist / 100
    this.origin = bounds(this.container)[OPP[edge]]

    if (!isRelative) {
      this.origin -= (value - this.getNewValue(event).value)
    }

    this.setState({
      isResizing: true,
      value
    })

    if (onDragStart) {
      return onDragStart(event, this)
    }
  }

  handleDrag = (event) => {
    if (this.props.onDrag) {
      this.props.onDrag(event, this)
    }

    let value = this.getNewValue(event)

    if (!this.props.onResize(value, this)) {
      this.setState({ value: value.value })
    }
  }

  handleDragStop = (event) => {
    this.scale = 1
    this.origin = 0

    if (this.props.onDragStop) {
      this.props.onDragStop(event, this)
    }

    if (this.state.value !== this.props.value) {
      this.props.onChange(this.state.value, this)
    }

    this.setState({
      isResizing: false,
      value: null
    })

  }

  renderHandle() {
    return this.props.isDisabled ? null : (
      <Draggable
        onDragStart={this.handleDragStart}
        onDrag={this.handleDrag}
        onDragStop={this.handleDragStop}
        className={cx([
          `resizable-handle-${DIR[this.props.edge]}`,
          `resizable-handle-${this.props.edge}`
        ])}/>
    )
  }

  render() {
    return React.createElement(this.props.node, {
      className: cx(this.classes),
      ref: this.setContainer,
      style: this.style
    }, this.props.children, this.renderHandle())
  }

  static propTypes = {
    children: node,
    className: string,
    edge: oneOf(keys(DIM)).isRequired,
    id: number,
    isBuffered: bool,
    isDisabled: bool,
    isRelative: bool,
    value: number.isRequired,
    min: number.isRequired,
    max: number,
    margin: number,
    node: string.isRequired,
    onChange: func.isRequired,
    onResize: func.isRequired,
    onDrag: func,
    onDragStart: func,
    onDragStop: func,
  }

  static defaultProps = {
    min: 0,
    node: 'div',
    onChange: noop,
    onResize: noop
  }
}

module.exports = {
  Resizable
}
