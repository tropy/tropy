import React from 'react'
import { useIntl } from 'react-intl'
import cx from 'classnames'
import { Toggle } from './form.js'
import * as icons from './icons.js'

export const ButtonGroup = ({ children }) => (
  <div className="btn-group">{children}</div>
)

export const Button = React.memo(({
  className,
  icon,
  isActive,
  isBlock,
  isDefault,
  isDisabled,
  isPrimary,
  noFocus,
  onBlur,
  onClick,
  onFocus,
  onMouseDown,
  size,
  tabIndex,
  text,
  title,
  type
}) => {

  let container = React.useRef()
  let intl = useIntl()

  let attr = {
    className: cx('btn', className, `btn-${size}`, {
      'active': isActive,
      'btn-block': isBlock,
      'btn-default': isDefault,
      'btn-icon': icon != null,
      'btn-primary': isPrimary,
      'disabled': isDisabled
    }),

    onBlur,
    onFocus,
    ref: container,
    title: title && intl.formatMessage({ id: title })
  }

  if (!noFocus) {
    attr.disabled = isDisabled
    attr.type = type
  }

  if (!isDisabled) {
    if (noFocus) {
      attr.onMouseDown = (event) => {
        event.preventDefault()
        onMouseDown?.(event)
      }
      attr.onClick = (event) => {
        event.preventDefault()
        onClick?.(event)
      }

    } else {
      attr.onClick = onClick
      attr.onMouseDown = onMouseDown
      attr.tabIndex = tabIndex
    }
  }

  if (typeof icon === 'string')
    icon = React.createElement(icons[icon])

  return React.createElement(
    noFocus ? 'span' : 'button',
    attr,
    icon,
    text && intl.formatMessage({ id: text }))
})

Button.defaultProps = {
  noFocus: false,
  size: 'md',
  tabIndex: -1,
  type: 'button'
}

export const ToggleButton = ({
  isChecked,
  isDisabled,
  name,
  onChange,
  size,
  text,
  tabIndex,
  value
}) => (
  <Toggle
    className={cx('btn', 'btn-toggle', `btn-${size}`)}
    id={text || name}
    isChecked={isChecked}
    isDisabled={isDisabled}
    name={name}
    onChange={onChange}
    tabIndex={tabIndex}
    type="radio"
    value={value}/>
)

ToggleButton.defaultProps = {
  size: 'md'
}

export const ToggleButtonGroup = ({
  id,
  name,
  onChange,
  size,
  options,
  tabIndex,
  value
}) => (
  <ButtonGroup>
    {options.map(option => (
      <ToggleButton
        isChecked={option === value}
        key={`${option}`}
        name={name}
        onChange={onChange}
        size={size}
        text={`${id || name}.option.${option}`}
        tabIndex={tabIndex}
        value={option}/>
    ))}
  </ButtonGroup>
)

ToggleButtonGroup.defaultProps = {
  size: 'md'
}

export const PlusMinusControls = ({
  canAdd,
  canRemove,
  onAdd,
  onRemove
}) => (
  <ButtonGroup>
    <Button
      icon="IconPlusCircle"
      isDisabled={!(canAdd && onAdd)}
      onClick={onAdd}/>
    <Button
      icon="IconMinusCircle"
      isDisabled={!(canRemove && onRemove)}
      onClick={onRemove}/>
  </ButtonGroup>
)
