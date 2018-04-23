'use strict'

const React = require('react')
const { PureComponent, createElement: create } = React
const { func, node, bool, number, oneOf, string } = require('prop-types')
const { Draggable } = require('./draggable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { noop, restrict, refine, titlecase } = require('../common/util')
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


class Resizable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      isResizing: false
    }
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
    return restrict(this.props.value, this.props.min, this.props.max)
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
    const { cssValue, cssMax, cssMin, dimension } = this
    return {
      [dimension]: cssValue,
      [`min${titlecase(dimension)}`]: cssMin,
      [`max${titlecase(dimension)}`]: cssMax
    }
  }

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  getNewValue(event) {
    const { edge, min, isRelative } = this.props
    const { isInverse, origin, scale, max } = this

    const value = restrict(
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
    const { edge, onDragStart, isRelative, value, margin, max } = this.props
    const dist = bounds(this.container.parentElement)[DIM[edge]]

    this.max = margin ? restrict(dist - margin, this.props.min) : max
    this.scale = dist / 100
    this.origin = bounds(this.container)[OPP[edge]]

    if (!isRelative) {
      this.origin -= (value - this.getNewValue(event).value)
    }

    this.setState({ isResizing: true })

    if (onDragStart) {
      return onDragStart(event, this)
    }
  }

  handleDrag = (event) => {
    if (this.props.onDrag) {
      this.props.onDrag(event, this)
    }

    if (this.props.onResize != null) {
      this.props.onResize(this.getNewValue(event))
    }
  }

  handleDragStop = (event) => {
    this.scale = 1
    this.origin = 0

    this.setState({ isResizing: false })

    if (this.props.onDragStop) {
      this.props.onDragStop(event, this)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return isDisabled ? null : (
      <Draggable
        onDragStart={this.handleDragStart}
        onDrag={this.handleDrag}
        onDragStop={this.handleDragStop}
        className={cx([
          `resizable-handle-${DIR[edge]}`,
          `resizable-handle-${edge}`
        ])}/>
    )
  }

  render() {
    return create(this.props.node, {
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
    isDisabled: bool,
    isRelative: bool,
    value: number.isRequired,
    min: number.isRequired,
    max: number,
    margin: number,
    node: string.isRequired,
    onResize: func,
    onDrag: func,
    onDragStart: func,
    onDragStop: func,
  }

  static defaultProps = {
    min: 0,
    node: 'div'
  }

}


class BufferedResizable extends Resizable {
  constructor(props) {
    super(props)

    this.state.value = props.value

    refine(this, 'handleDragStop', () => {
      const { value, onChange } = this.props

      if (value !== this.value && onChange) {
        onChange(this.value, this)
      }
    })
  }

  componentWillReceiveProps(props) {
    if (props.value !== this.props.value) {
      this.setState({ value: props.value })
    }
  }

  get value() {
    return this.state.value
  }

  handleDrag = (event) => {
    const value = this.getNewValue(event)
    if (!this.props.onResize(value, this)) {
      this.setState({ value: value.value })
    }
  }

  static propTypes = {
    ...Resizable.propTypes,
    onChange: func,
    onResize: func.isRequired
  }

  static defaultProps = {
    ...Resizable.defaultProps,
    onResize: noop
  }
}


module.exports = {
  Resizable,
  BufferedResizable
}
