'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, node, bool, number, oneOf } = PropTypes
const { Draggable } = require('./draggable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { noop, restrict } = require('../common/util')
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
      value: props.value
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

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  setContainer = (container) => {
    this.container = container
  }

  handleDrag = (event) => {
    const { edge, min, max, isRelative } = this.props

    let origin = bounds(this.container)[OPP[edge]]
    let value = event[AXS[edge]] - origin

    if (this.isInverse) {
      value = -value
    }

    if (isRelative) {
      value = value / bounds(this.container.parentElement)[DIM[edge]] * 100
      value = restrict(value, 0, 100)
    }

    value = restrict(value, min || 0, max)

    this.setState({ value })
    this.props.onResize(value)
  }

  handleDragStop = () => {
    if (this.props.value !== this.state.value) {
      this.props.onChange(this.state.value)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return !isDisabled && (
      <Draggable
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
    onChange: func.isRequired,
    onResize: func
  }

  static defaultProps = {
    min: 0,
    onResize: noop
  }
}


module.exports = {
  Resizable
}
