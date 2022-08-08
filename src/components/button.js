import React from 'react'
import { useIntl } from 'react-intl'
import cx from 'classnames'
import { Toggle } from './form.js'
import { IconPlusCircle, IconMinusCircle } from './icons.js'

import {
  arrayOf,
  bool,
  element,
  func,
  node,
  number,
  object,
  oneOf,
  string
} from 'prop-types'

export const ButtonGroup = ({ children }) => (
  <div className="btn-group">{children}</div>
)

ButtonGroup.propTypes = {
  children: node
}

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
      attr.handleMouseDown = (event) => {
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

  return React.createElement(
    noFocus ? 'span' : 'button',
    attr,
    icon,
    text && intl.formatMessage({ id: text }))
})

Button.propTypes = {
  className: string,
  icon: element,
  intl: object.isRequired,
  isActive: bool,
  isBlock: bool,
  isDefault: bool,
  isDisabled: bool,
  isPrimary: bool,
  noFocus: bool,
  size: oneOf(['sm', 'md', 'lg']),
  title: string,
  text: string,
  tabIndex: number,
  type: string.isRequired,
  onBlur: func,
  onFocus: func,
  onClick: func,
  onMouseDown: func
}

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
    className={cx('btn', `btn-${size}`)}
    id={text || name}
    isChecked={isChecked}
    isDisabled={isDisabled}
    name={name}
    onChange={onChange}
    tabIndex={tabIndex}
    type="radio"
    value={value}/>
)

ToggleButton.propTypes = {
  isChecked: bool,
  isDisabled: bool,
  name: string.isRequired,
  onChange: func.isRequired,
  size: oneOf(['sm', 'md', 'lg']),
  text: string,
  tabIndex: number,
  value: string
}

ToggleButton.defaultProps = {
  size: 'md',
  tabIndex: -1
}

export const ToggleButtonGroup = ({
  id,
  name,
  onChange,
  options,
  tabIndex,
  value
}) => (
  <ButtonGroup>
    {options.map(option =>
      <ToggleButton
        isChecked={option === value}
        key={`${option}`}
        name={name}
        onChange={onChange}
        text={`${id || name}.option.${option}`}
        tabIndex={tabIndex}
        value={option}/>)}
  </ButtonGroup>
)

ToggleButtonGroup.propTypes = {
  id: string,
  name: string.isRequired,
  onChange: func.isRequired,
  options: arrayOf(string).isRequired,
  tabIndex: number,
  value: string
}

export const PlusMinusControls = ({
  canAdd,
  canRemove,
  onAdd,
  onRemove
}) => (
  <ButtonGroup>
    <Button
      icon={<IconPlusCircle/>}
      isDisabled={!(canAdd && onAdd)}
      onClick={onAdd}/>
    <Button
      icon={<IconMinusCircle/>}
      isDisabled={!(canRemove && onRemove)}
      onClick={onRemove}/>
  </ButtonGroup>
)

PlusMinusControls.propTypes = {
  canAdd: bool,
  canRemove: bool,
  onAdd: func,
  onRemove: func
}
