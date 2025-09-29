import React from 'react'
import { FormattedMessage } from 'react-intl'
import { FormToggle } from '../form.js'
import { Slider } from '../slider.js'
import { Icon } from '../icons.js'
import { useEvent } from '../../hooks/use-event.js'
import { TABS } from '../../constants/index.js'

export const FilterControls = ({
  brightness,
  contrast,
  hue,
  isDisabled,
  negative,
  onChange,
  saturation,
  sharpen
}) => (
  <ul className="filter-controls" tabIndex="-1">
    <RangeFilter
      icon="Sun"
      isDisabled={isDisabled}
      name="brightness"
      onChange={onChange}
      value={brightness}/>
    <RangeFilter
      icon="Contrast"
      isDisabled={isDisabled}
      name="contrast"
      onChange={onChange}
      value={contrast}/>
    <RangeFilter
      icon="Hue"
      isDisabled={isDisabled}
      max={180}
      min={-180}
      name="hue"
      onChange={onChange}
      value={hue}/>
    <RangeFilter
      icon="Drop"
      isDisabled={isDisabled}
      name="saturation"
      onChange={onChange}
      value={saturation}/>
    <RangeFilter
      icon="Sharpen"
      isDisabled={isDisabled}
      max={200}
      min={0}
      name="sharpen"
      onChange={onChange}
      origin={null}
      value={sharpen}/>
    <ToggleFilter
      name="negative"
      isDisabled={isDisabled}
      onChange={onChange}
      value={negative}/>
  </ul>
)

export const RangeFilter = ({
  max = 100,
  min = -100,
  name,
  icon,
  isDisabled = false,
  onChange,
  origin = 0,
  tabIndex = TABS.EsperPanel,
  value
}) => {
  let handleChange = useEvent((next) => {
    onChange({ [name]: next })
  })

  return (
    <li className="filter-control color-slider">
      <div className="flex-row center">
        <Icon name={icon}/>
        <div className="title">
          <FormattedMessage
            id={`esper.panel.${name}.label`}/>
        </div>
        <div className="value">
          <FormattedMessage
            id={`esper.panel.${name}.value`}
            values={{ value }}/>
        </div>
      </div>
      <Slider
        isDisabled={isDisabled}
        max={max}
        min={min}
        origin={origin}
        tabIndex={tabIndex}
        value={value}
        onChange={handleChange}/>
    </li>
  )
}

export const ToggleFilter = ({
  name,
  isDisabled,
  onChange,
  tabIndex = TABS.EsperPanel,
  value
}) => (
  <li className="filter-control">
    <FormToggle
      id={`esper.panel.${name}`}
      name={name}
      isDisabled={isDisabled}
      tabIndex={tabIndex}
      value={value}
      onChange={onChange}/>
  </li>
)
