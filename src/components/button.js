import React from 'react'
import { useIntl } from 'react-intl'
import cx from 'classnames'
import {
  bool, element, func, node, number, object, oneOf, string
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
