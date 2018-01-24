'use strict'

const React = require('react')
const { PureComponent } = React
const { Slider } = require('../slider')
const { Button } = require('../button')
const { bool, element, func, number, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { FormToggle } = require('../form')
const { TABS } = require('../../constants')

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

  get tabIndex() {
    return this.props.isDisabled ? null : this.props.tabIndex
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
          origin={this.props.origin}
          tabIndex={this.tabIndex}
          value={this.props.value}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
          onChange={this.handleChange}/>
      </li>
    )
  }

  static propTypes = {
    icon: element.isRequired,
    isDisabled: bool,
    max: number.isRequired,
    min: number.isRequired,
    tabIndex: number,
    type: string.isRequired,
    onBlur: func,
    onChange: func.isRequired,
    onFocus: func,
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
        isDisabled={props.isDisabled || !props.isVisible}
        tabIndex={TABS.EsperPanel}
        type="brightness"
        value={props.brightness}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconContrast/>}
        isDisabled={props.isDisabled || !props.isVisible}
        tabIndex={TABS.EsperPanel}
        type="contrast"
        value={props.contrast}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconHue/>}
        isDisabled={props.isDisabled || !props.isVisible}
        tabIndex={TABS.EsperPanel}
        min={-180}
        max={180}
        type="hue"
        value={props.hue}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onChange={props.onChange}/>
      <ColorSlider
        icon={<IconDrop/>}
        isDisabled={props.isDisabled || !props.isVisible}
        tabIndex={TABS.EsperPanel}
        type="saturation"
        value={props.saturation}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onChange={props.onChange}/>
      <li>
        <FormToggle
          id="esper.panel.negative"
          name="negative"
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          value={props.negative}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
          onChange={props.onChange}/>
      </li>
    </ul>
    <Button
      noFocus
      isDefault
      text="esper.panel.revert"
      onClick={props.onRevert}/>
  </div>
)

EsperPanel.propTypes = {
  brightness: number.isRequired,
  contrast: number.isRequired,
  hue: number.isRequired,
  negative: bool.isRequired,
  saturation: number.isRequired,
  isDisabled: bool.isRequired,
  isVisible: bool.isRequired,
  onBlur: func,
  onChange: func.isRequired,
  onFocus: func,
  onRevert: func.isRequired
}

module.exports = {
  EsperPanel,
  ColorSlider
}
