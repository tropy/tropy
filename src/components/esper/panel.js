'use strict'

const React = require('react')
const { PureComponent } = React
const { Slider } = require('../slider')
const { bool, element, func, number, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')

const {
  IconSun,
  IconContrast,
  IconHue,
  IconDrop
} = require('../icons')


class ColorSlider extends PureComponent {
  handleChange = (value) => {
    this.props.onChange({ [this.props.type]: value })
  }

  renderLabel() {
    return (
      <div className="flex-row center">
        {this.props.icon}
        <div className="title">
          <FormattedMessage
            id={`esper.panel.${this.props.type}.label`}/>
        </div>
        <div className="value">
          <FormattedMessage
            id={`esper.panel.${this.props.type}.value`}
            values={{ value: this.props.value }}/>
        </div>
      </div>
    )
  }

  render() {
    return (
      <li className="adjustment color-slider">
        {this.renderLabel()}
        <Slider
          isDisabled={this.props.isDisabled}
          max={this.props.max}
          min={this.props.min}
          noFocus
          origin={this.props.origin}
          tabIndex={null}
          value={this.props.value} onChange={this.handleChange}/>
      </li>
    )
  }

  static propTypes = {
    icon: element.isRequired,
    isDisabled: bool,
    max: number.isRequired,
    min: number.isRequired,
    type: string.isRequired,
    onChange: func.isRequired,
    origin: number,
    value: number.isRequired
  }

  static defaultProps = {
    max: 100,
    min: -100,
    origin: 0
  }
}


const EsperPanel = (props) => (
  <div className="esper panel">
    <ul className="adjustments">
      <ColorSlider
        icon={<IconSun/>}
        isDisabled={props.isDisabled}
        type="brightness"
        value={props.brightness}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconContrast/>}
        isDisabled={props.isDisabled}
        type="contrast"
        value={props.contrast}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconHue/>}
        isDisabled={props.isDisabled}
        min={-180}
        max={180}
        type="hue"
        value={props.hue}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconDrop/>}
        isDisabled={props.isDisabled}
        type="saturation"
        value={props.saturation}
        onChange={props.onChange}/>
    </ul>
    <div className="btn revert" onClick={props.onRevert}>
      <FormattedMessage id="esper.panel.revert"/>
    </div>
  </div>
)

EsperPanel.propTypes = {
  brightness: number.isRequired,
  contrast: number.isRequired,
  hue: number.isRequired,
  saturation: number.isRequired,
  isDisabled: bool,
  onChange: func.isRequired,
  onRevert: func.isRequired
}

module.exports = {
  EsperPanel,
  ColorSlider
}
