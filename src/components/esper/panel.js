import React from 'react'
import { Slider } from '../slider'
import { Button } from '../button'
import { bool, element, func, number, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { FormToggle } from '../form'
import { shallow } from '../../common/util'
import { TABS } from '../../constants'

import {
  IconSun,
  IconContrast,
  IconHue,
  IconDrop,
  IconSharpen
} from '../icons'


export class ColorSlider extends React.PureComponent {
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


export const EsperPanel = (props) => {
  let isDefault = shallow(EsperPanel.defaultProps, props)

  return (
    <div className="esper-panel">
      <ul className="adjustments">
        <ColorSlider
          icon={<IconSun/>}
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          type="brightness"
          value={props.brightness}
          onChange={props.onChange}/>
        <ColorSlider
          icon={<IconContrast/>}
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          type="contrast"
          value={props.contrast}
          onChange={props.onChange}/>
        <ColorSlider
          icon={<IconHue/>}
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          min={-180}
          max={180}
          type="hue"
          value={props.hue}
          onChange={props.onChange}/>
        <ColorSlider
          icon={<IconDrop/>}
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          type="saturation"
          value={props.saturation}
          onChange={props.onChange}/>
        <ColorSlider
          icon={<IconSharpen/>}
          isDisabled={props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          type="sharpen"
          min={0}
          max={200}
          origin={null}
          value={props.sharpen}
          onChange={props.onChange}/>
        <li className="adjustment">
          <FormToggle
            id="esper.panel.negative"
            name="negative"
            isDisabled={props.isDisabled || !props.isVisible}
            tabIndex={TABS.EsperPanel}
            value={props.negative}
            onChange={props.onChange}/>
        </li>
      </ul>
      <div className="revert-btn-container">
        <Button
          isBlock
          isDefault
          isDisabled={isDefault || props.isDisabled || !props.isVisible}
          tabIndex={TABS.EsperPanel}
          text="esper.panel.revert"
          onClick={props.onRevert}/>
      </div>
    </div>
  )
}

EsperPanel.propTypes = {
  brightness: number.isRequired,
  contrast: number.isRequired,
  hue: number.isRequired,
  negative: bool.isRequired,
  saturation: number.isRequired,
  sharpen: number.isRequired,
  isDisabled: bool,
  isVisible: bool,
  onChange: func.isRequired,
  onRevert: func.isRequired
}

// Subtle: these are used to set EsperContainer's state!
EsperPanel.defaultProps = {
  brightness: 0,
  contrast: 0,
  hue: 0,
  negative: false,
  saturation: 0,
  sharpen: 0
}
