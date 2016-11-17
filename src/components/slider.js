'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')

class Slider extends Component {
  constructor(props) {
    super(props)
  }

  set = (value) => {
    if (value !== this.props.value) {
      this.props.onChange(value)
    }
  }

  min = () => this.set(this.props.min)
  max = () => this.set(this.props.max)


  renderMinButton() {
    const { min, minIcon, value } = this.props
    const active = value === min

    if (minIcon) {
      return (
        <button className={cn({ active })} onClick={this.min}>
          {this.props.minIcon}
        </button>
      )
    }
  }

  renderMaxButton() {
    const { max, maxIcon, value } = this.props
    const active = value === max

    if (maxIcon) {
      return (
        <button className={cn({ active })} onClick={this.max}>
          {this.props.maxIcon}
        </button>
      )
    }
  }

  render() {
    const { disabled } = this.props

    return (
      <div className={cn({ slider: true, disabled })}>
        {this.renderMinButton()}
        <div>...</div>
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
    max: 1
  }
}

module.exports = {
  Slider
}
