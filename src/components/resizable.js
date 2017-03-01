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
    return `${this.state.value}${this.props.isRelative ? '%' : 'px'}`
  }

  get style() {
    return this.isFlex ? null : {
      [this.dimension]: this.value
    }
  }

  get isFlex() {
    return this.state.value == null
  }

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  setContainer = (container) => {
    this.container = container
  }

  handleDrag = (event) => {
    const { edge, min, max, index, isRelative, onValidate } = this.props

    let origin = bounds(this.container)[OPP[edge]]
    let value = event[AXS[edge]] - origin

    if (this.isInverse) {
      value = -value
    }

    value = restrict(value, min, max)

    if (isRelative) {
      value = value / bounds(this.container.parentElement)[DIM[edge]] * 100
      value = restrict(value, null, 100)
    }

    if (onValidate(value, index)) {
      this.setState({ value })
      this.props.onResize(value, index)
    }
  }

  handleDragStop = () => {
    if (this.props.value !== this.state.value) {
      this.props.onChange(this.state.value, this.props.index)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return (
      <Draggable
        isDisabled={isDisabled || this.isFlex}
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
    index: number,
    isDisabled: bool,
    isRelative: bool,
    value: number,
    min: number.isRequired,
    max: number,
    onChange: func.isRequired,
    onResize: func.isRequired,
    onValidate: func.isRequired
  }

  static defaultProps = {
    min: 0,
    onResize: noop,
    onValidate: () => true
  }
}


module.exports = {
  Resizable
}
