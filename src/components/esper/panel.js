'use strict'

const React = require('react')
const { Component } = React
const { Slider } = require('../slider')
const { bool, func, number } = require('prop-types')
const cx = require('classnames')
const {
  IconContrastMin,
  IconContrastMax,
  IconSunSmall,
  IconSunLarge
} = require('../icons')


class EsperPanel extends Component {
  get classes() {
    return ['esper', 'panel', {
      show: this.props.isVisible
    }]
  }

  handleBrightnessChange = (brightness) => {
    this.props.onColorChange({ brightness })
  }

  handleContrastChange = (contrast) => {
    this.props.onColorChange({ contrast })
  }

  render() {
    return (
      <div className={cx(this.classes)}>
        <Slider
          noFocus
          value={1}
          min={0}
          max={2}
          origin={1}
          precision={100}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleBrightnessChange}
          minIcon={<IconSunSmall/>}
          maxIcon={<IconSunLarge/>}/>
        <Slider
          noFocus
          value={0}
          min={-1}
          max={1}
          origin={0}
          precision={100}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleContrastChange}
          minIcon={<IconContrastMin/>}
          maxIcon={<IconContrastMax/>}/>
      </div>
    )
  }

  static propTypes = {
    brightness: number.isRequired,
    contrast: number.isRequired,
    isDisabled: bool,
    isVisible: bool,
    onColorChange: func.isRequired
  }
}

module.exports = {
  EsperPanel
}
