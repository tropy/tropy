'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { IconButton } = require('./button')
const { Draggable } = require('./draggable')
const { bounds, borders } = require('../dom')
const { restrict } = require('../common/util')
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
        value !== this.round(this.state.value)) {
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


  handleDrag = ({ pageX }) => {
    const { min, max } = this.props
    const box = bounds(this.track)
    const border = borders(this.track)

    const left = box.left + border.left
    const width = box.width - border.left - border.right

    this.set(min + restrict((pageX - left) / width, 0, 1) * max)
  }

  set(value) {
    this.setState({ value })

    const nearest = this.round(value)

    if (nearest !== this.props.value) {
      this.props.onChange(nearest)
    }
  }

  round(value, precision = this.props.precision) {
    return Math.round(value * precision) / precision
  }

  min = () => {
    this.set(this.props.min)
  }

  max = () => {
    this.set(this.props.max)
  }

  setTrack = (track) => this.track = track


  renderMinButton() {
    const { min, minIcon } = this.props
    const { value } = this.state

    if (minIcon) {
      return (
        <IconButton
          icon={this.props.minIcon}
          isActive={value === min}
          isDisabled={this.isDisabled}
          onMouseDown={this.min}/>
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
          onMouseDown={this.max}/>
      )
    }
  }

  render() {
    const { offset, delta, isDisabled } = this

    const percentage = `${100 * offset / delta}%`

    return (
      <Draggable
        classes={this.classes}
        delay={15}
        isDisabled={isDisabled}
        onDrag={this.handleDrag}>
        {this.renderMinButton()}
        <div ref={this.setTrack} className="slider-track">
          <div className="slider-range" style={{ width: percentage }}/>
          <div
            className="slider-handle"
            tabIndex="-1"
            style={{ left: percentage }}/>
        </div>
        {this.renderMaxButton()}
      </Draggable>
    )
  }

  static propTypes = {
    value: number.isRequired,
    isDisabled: bool,

    min: number.isRequired,
    max: number.isRequired,
    precision: number.isRequired,

    size: oneOf(['sm', 'md', 'lg']).isRequired,

    minIcon: element,
    maxIcon: element,

    onChange: func.isRequired
  }

  static defaultProps = {
    min: 0,
    max: 1,
    size: 'md',
    precision: 1
  }
}

module.exports = {
  Slider
}
