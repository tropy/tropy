'use strict'

const React = require('react')
const { bool, element, number, oneOfType, string } = require('prop-types')

const AutoResizer = ({ children, content, isDisabled }) =>
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

module.exports = {
  AutoResizer
}
