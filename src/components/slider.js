'use strict'

const React = require('react')
const { PureComponent } = React
const { PropTypes } = require('prop-types')
const { IconButton } = require('./button')
const { Draggable } = require('./draggable')
const { bounds, borders } = require('../dom')
const { restrict } = require('../common/util')
const { bool, element, func, number, oneOf } = PropTypes
const { round } = Math


class Slider extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value }) {
    if (value !== this.props.value &&
        value !== round(this.state.value)) {
      this.setState({ value })
    }
  }

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
      disabled: this.props.isDisabled
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

    const nearest = round(value)

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

    size: oneOf(['sm', 'md', 'lg']).isRequired,

    minIcon: element,
    maxIcon: element,

    onChange: func.isRequired
  }

  static defaultProps = {
    min: 0,
    max: 1,
    size: 'md'
  }
}

module.exports = {
  Slider
}
