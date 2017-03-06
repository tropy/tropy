'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, node, bool, number, oneOf } = PropTypes
const { Draggable } = require('./draggable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { noop, restrict, titlecase } = require('../common/util')
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
  get classes() {
    return {
      resizable: true,
      disabled: this.props.isDisabled,
      flex: this.isFlex
    }
  }

  get dimension() {
    return DIM[this.props.edge]
  }

  get value() {
    return this.props.value
  }

  get cssValue() {
    return `${this.value}${this.props.isRelative ? '%' : 'px'}`
  }

  get style() {
    const { cssValue, dimension, isFlex } = this

    return isFlex ? null : {
      [dimension]: cssValue,
      [`min${titlecase(dimension)}`]: `${this.props.min}px`
    }
  }

  get isFlex() {
    return this.value == null
  }

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  getNewValue(event) {
    const { edge, min, max, isRelative } = this.props

    let origin = bounds(this.container)[OPP[edge]]
    let value = event[AXS[edge]] - origin

    if (this.isInverse) value = -value

    value = restrict(value, min, max)

    if (isRelative) {
      value = restrict(value / this.scale, null, 100)
    }

    return value
  }

  setContainer = (container) => {
    this.container = container
  }

  handleDragStart = (event) => {
    const { edge, onResizeStart } = this.props

    this.scale = bounds(this.container.parentElement)[DIM[edge]] / 100

    if (onResizeStart) {
      return onResizeStart(event, this)
    }
  }

  handleDrag = (event) => {
    this.props.onResize(this.getNewValue(event), event, this)
  }

  handleDragStop = () => {
    const { value, onResizeStop, onChange } = this.props

    if (onResizeStop) {
      onResizeStop(this.value, this)
    }

    if (value !== this.value && onChange) {
      onChange(this.value, this)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return (
      <Draggable
        isDisabled={isDisabled || this.isFlex}
        onDragStart={this.handleDragStart}
        onDrag={this.handleDrag}
        onDragStop={this.handleDragStop}
        classes={cx([
          `resizable-handle-${DIR[edge]}`,
          `resizable-handle-${edge}`
        ])}/>
    )
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        ref={this.setContainer}
        style={this.style}>
        {this.props.children}
        {this.renderHandle()}
      </div>
    )
  }

  static propTypes = {
    children: node,
    edge: oneOf(keys(DIM)).isRequired,
    id: number,
    isDisabled: bool,
    isRelative: bool,
    value: number,
    min: number.isRequired,
    max: number,
    onChange: func,
    onResize: func.isRequired,
    onResizeStart: func,
    onResizeStop: func,
  }

  static defaultProps = {
    min: 0,
    onResize: noop
  }

}


class BufferedResizable extends Resizable {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps(props) {
    this.setState({ value: props.value })
  }

  get value() {
    return this.state.value
  }

  handleDrag = (event) => {
    const value = this.getNewValue(event)

    if (!this.props.onResize(value, event, this)) {
      this.setState({ value })
    }
  }
}


module.exports = {
  Resizable,
  BufferedResizable
}
