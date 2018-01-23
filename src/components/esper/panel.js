'use strict'

const React = require('react')
const { Component } = React
const { Slider } = require('../slider')
const { bool, func, number } = require('prop-types')
const cx = require('classnames')
const { FormattedMessage } = require('react-intl')
const {
  IconSun,
  IconContrast,
  IconHue,
  IconDrop
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
        <ul className="adjustments">
          <li className="adjustment">
            <IconSun />
            <div className="title">
              <FormattedMessage id="esper.panel.brightness"/>
            </div>
            <div className="value">
              0
            </div>
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
          </li>
          <li className="adjustment">
            <IconContrast />
            <div className="title">
              <FormattedMessage id="esper.panel.contrast"/>
            </div>
            <div className="value">
              0
            </div>
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
          </li>
          <li className="adjustment">
            <IconHue />
            <div className="title">
              <FormattedMessage id="esper.panel.hue"/>
            </div>
            <div className="value">
              0
            </div>
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
          </li>
          <li className="adjustment">
            <IconDrop />
            <div className="title">
              <FormattedMessage id="esper.panel.saturation"/>
            </div>
            <div className="value">
              0
            </div>
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
          </li>
        </ul>
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
