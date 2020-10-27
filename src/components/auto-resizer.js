import React from 'react'
import { bool, element, number, oneOfType, string } from 'prop-types'

export const AutoResizer = ({ children, content, isDisabled }) =>
  isDisabled ? children : (
    <div className="auto-resizer">
      <div className="content">{content}</div>
      {children}
    </div>
  )

AutoResizer.propTypes = {
  children: element.isRequired,
  content: oneOfType([string, number]),
  isDisabled: bool
}
