'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconButton } = require('./button')
const cn = require('classnames')
const { bounds, borders, on, off } = require('../dom')
const { noop } = require('../common/util')


class Slider extends Component {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value }) {
    if (value !== this.props.value &&
        value !== Math.round(this.state.value)) {
      this.setState({ value })
    }
  }

  componentWillUnmount() {
    if (this.state.dragging) {
      this.stopDragging()
    }
  }

  update = (event) => {
    if (this.delayed) {
      clearTimeout(this.delayed)
      this.delayed = null
    }

    const { min, max } = this.props
    const box = bounds(this.track)
    const border = borders(this.track)

    const left = box.left + border.left
    const width = box.width - border.left - border.right

    this.set(min + restrict((event.pageX - left) / width) * max)
  }

  handleMouseDown = ({ button, pageX }) => {
    if (button !== 0) return

    this.delayed = setTimeout(() => this.update({ pageX }), 50)
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

  setTrack = (track) => this.track = track

  get offset() {
    return this.state.value - this.props.min
  }

  get delta() {
    return this.props.max - this.props.min
  }

  get classes() {
    return {
      slider: true,
      [`slider-${this.props.size}`]: true,
      disabled: this.props.disabled,
      dragging: this.state.dragging
    }
  }

  startDragging() {
    this.setState({ dragging: true })

    on(document, 'mousemove', this.update)
    on(document, 'mouseup', this.handleMouseUp)
    on(document, 'mouseleave', this.stopDragging)
    on(window, 'blur', this.handleMouseUp)
  }

  stopDragging = () => {
    this.setState({ dragging: false })

    off(document, 'mousemove', this.update)
    off(document, 'mouseup', this.handleMouseUp)
    off(document, 'mouseleave', this.stopDragging)
    off(window, 'blur', this.handleMouseUp)

    if (this.delayed) {
      clearTimeout(this.delayed)
      this.delayed = null
    }
  }


  renderMinButton() {
    const { min, minIcon, disabled } = this.props
    const { value } = this.state

    if (minIcon) {
      return (
        <IconButton
          icon={this.props.minIcon}
          disabled={disabled || value === min}
          onMouseDown={this.min}/>
      )
    }
  }

  renderMaxButton() {
    const { max, maxIcon, disabled } = this.props
    const { value } = this.state

    if (maxIcon) {
      return (
        <IconButton
          icon={this.props.maxIcon}
          disabled={disabled || value === max}
          onMouseDown={this.max}/>
      )
    }
  }

  render() {
    const { disabled } = this.props
    const { offset, delta } = this

    const percentage = `${100 * offset / delta}%`

    return (
      <div
        className={cn(this.classes)}
        onMouseDown={disabled ? noop : this.handleMouseDown}>
        {this.renderMinButton()}
        <div
          ref={this.setTrack}
          className="slider-track">
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

    size: PropTypes.oneOf(['sm', 'md', 'lg']),

    minIcon: PropTypes.element,
    maxIcon: PropTypes.element,

    onChange: PropTypes.func
  }

  static defaultProps = {
    min: 0,
    max: 1,
    size: 'md',
    onChange: noop
  }
}

function restrict(value, lower = 0, upper = 1) {
  return Math.min(Math.max(value, lower), upper)
}

module.exports = {
  Slider
}
