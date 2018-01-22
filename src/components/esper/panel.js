'use strict'

const React = require('react')
const { Component } = React
const { Slider } = require('../slider')
const { bool, func, number } = require('prop-types')
const cx = require('classnames')
const { FormattedMessage } = require('react-intl')


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

  handleHueChange = (hue) => {
    this.props.onColorChange({ hue })
  }

  handleSaturationChange = (saturation) => {
    this.props.onColorChange({ saturation })
  }

  handleGammaChange = (gamma) => {
    this.props.onColorChange({ gamma })
  }

  render() {
    return (
      <div className={cx(this.classes)}>
        <FormattedMessage id="esper.panel.gamma"/>
        <Slider
          noFocus
          value={this.props.gamma}
          min={0}
          max={2}
          origin={1}
          precision={100}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleGammaChange}/>
        <FormattedMessage id="esper.panel.brightness"/>
        <Slider
          noFocus
          value={this.props.brightness}
          min={0}
          max={2}
          origin={1}
          precision={100}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleBrightnessChange}/>
        <FormattedMessage id="esper.panel.contrast"/>
        <Slider
          noFocus
          value={this.props.contrast}
          min={0}
          max={2}
          origin={1}
          precision={100}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleContrastChange}/>
        <FormattedMessage id="esper.panel.hue"/>
        <Slider
          noFocus
          value={this.props.hue}
          min={-180}
          max={180}
          origin={0}
          precision={10}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleHueChange}/>
        <FormattedMessage id="esper.panel.saturation"/>
        <Slider
          noFocus
          value={this.props.saturation}
          min={0}
          max={2}
          origin={1}
          precision={10}
          isDisabled={this.props.isDisabled}
          tabIndex={null}
          onChange={this.handleSaturationChange}/>
      </div>
    )
  }

  static propTypes = {
    brightness: number.isRequired,
    contrast: number.isRequired,
    hue: number.isRequired,
    saturation: number.isRequired,
    gamma: number.isRequired,
    isDisabled: bool,
    isVisible: bool,
    onColorChange: func.isRequired
  }
}

module.exports = {
  EsperPanel
}
