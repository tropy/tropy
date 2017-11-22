'use strict'

const React = require('react')
const { PureComponent } = React
const { IconButton } = require('./button')
const { Draggable } = require('./draggable')
const { bounds, borders } = require('../dom')
const { restrict } = require('../common/util')
const { round } = require('../common/math')
const { arrayOf, bool, element, func, number, oneOf } = require('prop-types')
const cx = require('classnames')
const throttle = require('lodash.throttle')


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
    const { value } = this.props

    if (steps.length === 0) return max

    let i = 0
    while (i < steps.length && value >= steps[i]) ++i

    if (steps.length === i) return max

    return Math.min(steps[i], max)
  }

  getPrevStep() {
    const { min, steps } = this.props
    const { value } = this.props

    if (steps.length === 0) return min

    let i = steps.length - 1
    while (i >= 0 && value <= steps[i]) --i

    if (i < 0) return min

    return Math.max(steps[i], min)
  }


  set(value, reason) {
    value = restrict(value, this.props.min, this.props.max)
    this.setState({ value })

    value  = this.round(value)
    if (value !== this.props.value) {
      this.props.onChange(value, reason)
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

  handleMinButtonClick = throttle(() => {
    this.set(this.getPrevStep(), 'button')
  }, 100)

  handleMaxButtonClick = throttle(() => {
    this.set(this.getNextStep(), 'button')
  }, 100)

  setTrack = (track) => {
    this.track = track
  }


  renderMinButton() {
    const { min, minIcon } = this.props
    const { value } = this.state

    if (minIcon) {
      return (
        <IconButton
          noFocus={this.props.noFocus}
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
          noFocus={this.props.noFocus}
          icon={this.props.maxIcon}
          isActive={value === max}
          isDisabled={this.isDisabled}
          onMouseDown={this.handleMaxButtonClick}/>
      )
    }
  }

  renderCurrentValue() {
    return this.props.showCurrentValue && (
      <div className="slider-value">
        {round(this.props.value * 100)}&thinsp;%
      </div>
    )
  }

  render() {
    const { offset, delta, isDisabled } = this
    const percentage = `${100 * offset / delta}%`

    return (
      <div className={cx(this.classes)}>
        {this.renderMinButton()}
        <Draggable
          delay={15}
          isDisabled={isDisabled}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}>
          <div ref={this.setTrack} className="slider-track">
            <div className="slider-range" style={{ width: percentage }}/>
            <div
              className="slider-handle"
              tabIndex={this.props.tabIndex}
              style={{ left: percentage }}>
              {this.renderCurrentValue()}
            </div>
          </div>
        </Draggable>
        {this.renderMaxButton()}
      </div>
    )
  }

  static propTypes = {
    noFocus: bool,
    isDisabled: bool,
    max: number.isRequired,
    maxIcon: element,
    min: number.isRequired,
    minIcon: element,
    precision: number.isRequired,
    showCurrentValue: bool.isRequired,
    size: oneOf(['sm', 'md', 'lg']).isRequired,
    steps: arrayOf(number).isRequired,
    tabIndex: number,
    value: number.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    min: 0,
    max: 1,
    precision: 1,
    showCurrentValue: false,
    size: 'md',
    steps: [],
    tabIndex: -1
  }
}

module.exports = {
  Slider
}
