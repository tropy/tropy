'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { IconButton } = require('./button')
const cx = require('classnames')
const { bounds, borders, on, off } = require('../dom')
const { noop } = require('../common/util')
const { bool, element, func, number, oneOf } = PropTypes


class Slider extends PureComponent {
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
    if (this.state.isDragging) {
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
    try {
      if (event instanceof MouseEvent) {
        this.update(event)
      }

    } finally {
      this.stopDragging()
    }
  }

  set = (value) => {
    this.setState({ value })

    const nearest = Math.round(value)

    if (nearest !== this.props.value) {
      this.props.onChange(nearest)
    }
  }

  min = () => {
    this.set(this.props.min)
  }

  max = () => {
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
      isDisabled: this.props.isDisabled,
      isDragging: this.state.isDragging
    }
  }

  startDragging() {
    this.setState({ isDragging: true })

    on(document, 'mousemove', this.update)
    on(document, 'mouseup', this.handleMouseUp, { capture: true })
    on(document, 'mouseleave', this.stopDragging)
    on(window, 'blur', this.handleMouseUp)
  }

  stopDragging = () => {
    this.setState({ isDragging: false })

    off(document, 'mousemove', this.update)
    off(document, 'mouseup', this.handleMouseUp, { capture: true })
    off(document, 'mouseleave', this.stopDragging)
    off(window, 'blur', this.handleMouseUp)

    if (this.delayed) {
      clearTimeout(this.delayed)
      this.delayed = null
    }
  }


  renderMinButton() {
    const { min, minIcon, isDisabled } = this.props
    const { value } = this.state

    if (minIcon) {
      return (
        <IconButton
          icon={this.props.minIcon}
          isActive={value === min}
          isDisabled={isDisabled}
          onMouseDown={this.min}/>
      )
    }
  }

  renderMaxButton() {
    const { max, maxIcon, isDisabled } = this.props
    const { value } = this.state

    if (maxIcon) {
      return (
        <IconButton
          icon={this.props.maxIcon}
          isActive={value === max}
          isDisabled={isDisabled}
          onMouseDown={this.max}/>
      )
    }
  }

  render() {
    const { isDisabled } = this.props
    const { offset, delta } = this

    const percentage = `${100 * offset / delta}%`

    return (
      <div
        className={cx(this.classes)}
        onMouseDown={isDisabled ? null : this.handleMouseDown}>
        {this.renderMinButton()}
        <div ref={this.setTrack} className="slider-track">
          <div className="slider-range" style={{ width: percentage }}/>
          <div
            className="slider-handle"
            tabIndex="-1"
            style={{ left: percentage }}/>
        </div>
        {this.renderMaxButton()}
      </div>
    )
  }

  static propTypes = {
    value: number.isRequired,
    isDisabled: bool,

    min: number.isRequired,
    max: number.isRequired,

    size: oneOf(['sm', 'md', 'lg']).isRequired,

    minIcon: element,
    maxIcon: element,

    onChange: func.isRequired
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
