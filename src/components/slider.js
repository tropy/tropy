'use strict'

const React = require('react')
const { Button } = require('./button')
const { Draggable } = require('./draggable')
const { bounds, borders } = require('../dom')
const { restrict } = require('../common/util')
const { round } = require('../common/math')
const cx = require('classnames')
const throttle = require('lodash.throttle')
const { KeyMap } = require('../keymap')

const {
  arrayOf, bool, element, func, instanceOf, number, oneOf
} = require('prop-types')


class Slider extends React.PureComponent {
  track = React.createRef()

  state = {
    hasFocus: false,
    value: 0
  }

  static getDerivedStateFromProps(props, state) {
    let value = round(props.value, props.precision)
    return (value !== state.value) ? { value } : null
  }

  get origin() {
    return (this.props.origin != null) ? this.props.origin : this.props.min
  }

  get delta() {
    return this.props.max - this.props.min
  }

  get isDisabled() {
    return this.props.isDisabled || this.delta <= 0
  }

  get classes() {
    return ['slider', `slider-${this.props.size}`, {
      disabled: this.isDisabled,
      origin: this.props.origin != null
    }]
  }

  get tabIndex() {
    return this.props.isDisabled ? null : this.props.tabIndex
  }

  getNextStep() {
    let { max, steps } = this.props
    let { value } = this.props

    if (steps.length === 0) return max

    let i = 0
    while (i < steps.length && value >= steps[i]) ++i

    if (steps.length === i) return max

    return Math.min(steps[i], max)
  }

  getPrevStep() {
    let { min, steps } = this.props
    let { value } = this.props

    if (steps.length === 0) return min

    let i = steps.length - 1
    while (i >= 0 && value <= steps[i]) --i

    if (i < 0) return min

    return Math.max(steps[i], min)
  }

  set(value, reason) {
    value = restrict(value, this.props.min, this.props.max)
    this.setState({ value })

    value  = round(value, this.props.precision)
    if (value !== this.props.value) {
      this.props.onChange(value, reason)
    }
  }

  handleDragStart = (event) => {
    this.handleDrag(event, 'drag-start')
  }

  handleDrag = ({ pageX }, reason = 'drag') => {
    let { min } = this.props
    let box = bounds(this.track.current)
    let border = borders(this.track.current)

    let left = box.left + border.left
    let width = box.width - border.left - border.right

    this.set(min + restrict((pageX - left) / width, 0, 1) * this.delta, reason)
  }

  handleMinButtonClick = throttle(() => {
    this.set(this.getPrevStep(), 'button')
  }, 100)

  handleMaxButtonClick = throttle(() => {
    this.set(this.getNextStep(), 'button')
  }, 100)

  handleBlur = () => {
    this.setState({ hasFocus: false })
  }

  handleFocus = () => {
    this.setState({ hasFocus: true })
  }

  handleKeyDown = (event) => {
    let { value, precision, keymap, tabIndex } = this.props

    if (tabIndex == null) return

    switch (keymap.match(event)) {
      case 'down':
        this.set(this.getPrevStep(), 'key')
        break
      case 'left':
        this.set(value - 1 / precision, 'key')
        break
      case 'up':
        this.set(this.getNextStep(), 'key')
        break
      case 'right':
        this.set(value + 1 / precision, 'key')
        break
      case 'reset':
        this.set(this.origin, 'key')
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleWheel = (event) => {
    if (this.state.hasFocus) {
      let { value, precision } = this.props
      let delta = event.deltaY || event.deltaX

      this.set(value + (delta < 0 ? -1 : 1) / precision, 'wheel')
    }
  }

  renderMinButton() {
    let { min, minIcon } = this.props
    let { value } = this.state

    if (minIcon) {
      return (
        <Button
          noFocus
          icon={this.props.minIcon}
          isActive={value === min}
          isDisabled={this.isDisabled}
          onMouseDown={this.handleMinButtonClick}/>
      )
    }
  }

  renderMaxButton() {
    let { max, maxIcon } = this.props
    let { value } = this.state

    if (maxIcon) {
      return (
        <Button
          noFocus
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
        {round(this.props.value * this.props.resolution)}&thinsp;%
      </div>
    )
  }

  render() {
    let { origin, delta, isDisabled } = this

    let abs = this.state.value - this.props.min
    let off = origin - this.props.min
    let adj = abs - off

    let offset = pct((adj < 0 ? off + adj : off) / delta)
    let position = pct(abs / delta)
    let width = pct(Math.abs(adj) / delta)

    return (
      <div
        className={cx(this.classes)}
        tabIndex={this.tabIndex}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        onWheel={this.handleWheel}>
        {this.renderMinButton()}
        <Draggable
          delay={15}
          isDisabled={isDisabled}
          stopOnMouseLeave={this.props.stopOnMouseLeave}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}>
          <div ref={this.track} className="slider-track">
            <div className="slider-range" style={{ width, left: offset }}/>
            <div
              className="slider-handle"
              style={{ left: position }}>
              {this.renderCurrentValue()}
            </div>
          </div>
        </Draggable>
        {this.renderMaxButton()}
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,
    keymap: instanceOf(KeyMap).isRequired,
    max: number.isRequired,
    maxIcon: element,
    min: number.isRequired,
    minIcon: element,
    origin: number,
    precision: number.isRequired,
    resolution: number.isRequired,
    showCurrentValue: bool.isRequired,
    size: oneOf(['sm', 'md', 'lg']).isRequired,
    steps: arrayOf(number).isRequired,
    stopOnMouseLeave: bool,
    tabIndex: number,
    value: number.isRequired,
    onBlur: func,
    onChange: func.isRequired,
    onFocus: func
  }

  static defaultProps = {
    min: 0,
    max: 1,
    precision: 1,
    resolution: 100,
    showCurrentValue: false,
    size: 'md',
    steps: [],
    stopOnMouseLeave: false,
    tabIndex: null,

    keymap: new KeyMap({
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      reset: ['Space', 'Escape']
    })
  }
}

const pct = (value) => `${100 * value}%`

module.exports = {
  Slider
}
