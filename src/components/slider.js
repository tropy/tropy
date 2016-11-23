'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')
const { bounds, on, off } = require('../dom')
const { noop } = require('../common/util')


class Slider extends Component {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value }) {
    this.setState({ value })
  }

  componentWillUnmount() {
    if (this.state.dragging) {
      this.stopDragging()
    }
  }

  update = (event) => {
    const { min, max } = this.props
    const { left, width } = bounds(this.scale)

    this.set(min + restrict((event.pageX - left) / width) * max)
  }

  handleMouseDown = (event) => {
    event.stopPropagation()

    this.update(event)
    this.startDragging()
  }

  handleMouseUp = (event) => {
    event.stopPropagation()

    this.update(event)
    this.stopDragging()
  }

  set = (value) => {
    this.setState({ value })

    const nearest = Math.round(value)

    if (nearest !== this.props.value) {
      this.props.onChange(nearest)
    }
  }

  min = (event) => {
    event.stopPropagation()
    this.set(this.props.min)
  }

  max = (event) => {
    event.stopPropagation()
    this.set(this.props.max)
  }

  setScale = (scale) => this.scale = scale

  get offset() {
    return this.state.value - this.props.min
  }

  get delta() {
    return this.props.max - this.props.min
  }

  startDragging() {
    this.setState({ dragging: true })

    on(document.body, 'mousemove', this.update)
    on(document.body, 'mouseup', this.handleMouseUp)
    on(document, 'mouseleave', this.stopDragging)
    on(window, 'blur', this.handleMouseUp)
  }

  stopDragging = () => {
    this.setState({ dragging: false })

    off(document.body, 'mousemove', this.update)
    off(document.body, 'mouseup', this.handleMouseUp)
    off(document, 'mouseleave', this.stopDragging)
    off(window, 'blur', this.handleMouseUp)
  }


  renderMinButton() {
    const { min, minIcon } = this.props
    const { value } = this.state

    const active = value === min

    if (minIcon) {
      return (
        <button className={cn({ active }, 'btn btn-icon')} onClick={this.min}>
          {this.props.minIcon}
        </button>
      )
    }
  }

  renderMaxButton() {
    const { max, maxIcon } = this.props
    const { value } = this.state

    const active = value === max

    if (maxIcon) {
      return (
        <button className={cn({ active }, 'btn btn-icon')} onClick={this.max}>
          {this.props.maxIcon}
        </button>
      )
    }
  }

  render() {
    const { disabled } = this.props
    const { dragging } = this.state
    const { offset, delta } = this

    const percentage = `${100 * offset / delta}%`

    return (
      <div
        className={cn({ slider: true, disabled, dragging })}
        onMouseDown={disabled ? noop : this.handleMouseDown}>
        {this.renderMinButton()}
        <div
          ref={this.setScale}
          className="slider-scale">
          <div className="slider-range" style={{ width: percentage }}/>
          <div className="slider-handle" style={{ left: percentage }}/>
        </div>
        {this.renderMaxButton()}
      </div>
    )
  }

  static propTypes = {
    value: PropTypes.number.isRequired,
    disabled: PropTypes.bool,

    min: PropTypes.number,
    max: PropTypes.number,

    minIcon: PropTypes.element,
    maxIcon: PropTypes.element,

    onChange: PropTypes.func
  }

  static defaultProps = {
    min: 0,
    max: 1,
    onChange: noop
  }
}

function restrict(value, lower = 0, upper = 1) {
  return Math.min(Math.max(value, lower), upper)
}

module.exports = {
  Slider
}
