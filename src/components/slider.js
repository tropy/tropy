'use strict'

const React = require('react')
const { PureComponent } = React
const { IconButton } = require('./button')
const { Draggable } = require('./draggable')
const { bounds, borders } = require('../dom')
const { restrict } = require('../common/util')
const { round } = require('../common/math')
const { arrayOf, bool, element, func, number, oneOf } = require('prop-types')


class Slider extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value, precision }) {
    if (value !== this.props.value &&
        value !== this.round(this.state.value, precision)) {
      this.setState({ value })
    }
  }

  get offset() {
    return this.state.value - this.props.min
  }

  get delta() {
    return this.props.max - this.props.min
  }

  get isDisabled() {
    return this.props.isDisabled || this.delta <= 0
  }

  get classes() {
    return {
      slider: true,
      [`slider-${this.props.size}`]: true,
      disabled: this.isDisabled
    }
  }

  getNextStep() {
    const { max, steps } = this.props
    const { value } = this.state

    if (steps.length === 0) return max

    let i = 0
    while (i < steps.length && value >= steps[i]) ++i

    if (steps.length === i) return max

    return Math.min(steps[i], max)
  }

  getPrevStep() {
    const { min, steps } = this.props
    const { value } = this.state

    if (steps.length === 0) return min

    let i = steps.length - 1
    while (i >= 0 && value <= steps[i]) --i

    if (i < 0) return min

    return Math.max(steps[i], min)
  }


  set(value, reason) {
    this.setState({ value })

    if (value === this.props.min) {
      return this.props.onChange(value, reason)
    }

    if (value === this.props.max) {
      return this.props.onChange(value, reason)
    }

    const nearest = this.round(value)
    if (nearest !== this.props.value) {
      this.props.onChange(nearest, reason)
    }
  }

  round(value, precision = this.props.precision) {
    return round(value, precision)
  }

  handleDragStart = (event) => {
    this.handleDrag(event, 'drag-start')
  }

  handleDrag = ({ pageX }, reason = 'drag') => {
    const { min } = this.props
    const box = bounds(this.track)
    const border = borders(this.track)

    const left = box.left + border.left
    const width = box.width - border.left - border.right

    this.set(min + restrict((pageX - left) / width, 0, 1) * this.delta, reason)
  }

  handleMinButtonClick = (event) => {
    event.stopPropagation()
    this.set(this.getPrevStep(), 'button')
  }

  handleMaxButtonClick = (event) => {
    event.stopPropagation()
    this.set(this.getNextStep(), 'button')
  }

  setTrack = (track) => {
    this.track = track
  }


  renderMinButton() {
    const { min, minIcon } = this.props
    const { value } = this.state

    if (minIcon) {
      return (
        <IconButton
          icon={this.props.minIcon}
          isActive={value === min}
          isDisabled={this.isDisabled}
          onMouseDown={this.handleMinButtonClick}/>
      )
    }
  }

  renderMaxButton() {
    const { max, maxIcon } = this.props
    const { value } = this.state

    if (maxIcon) {
      return (
        <IconButton
          icon={this.props.maxIcon}
          isActive={value === max}
          isDisabled={this.isDisabled}
          onMouseDown={this.handleMaxButtonClick}/>
      )
    }
  }

  render() {
    const { offset, delta, isDisabled } = this
    const percentage = `${100 * offset / delta}%`

    return (
      <div>
        {this.renderMinButton()}
        <Draggable
          classes={this.classes}
          delay={15}
          isDisabled={isDisabled}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}>
          <div ref={this.setTrack} className="slider-track">
            <div className="slider-range" style={{ width: percentage }}/>
            <div
              className="slider-handle"
              tabIndex="-1"
              style={{ left: percentage }}/>
          </div>
        </Draggable>
        {this.renderMaxButton()}
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,
    max: number.isRequired,
    maxIcon: element,
    min: number.isRequired,
    minIcon: element,
    precision: number.isRequired,
    size: oneOf(['sm', 'md', 'lg']).isRequired,
    steps: arrayOf(number).isRequired,
    value: number.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    min: 0,
    max: 1,
    precision: 1,
    size: 'md',
    steps: []
  }
}

module.exports = {
  Slider
}
