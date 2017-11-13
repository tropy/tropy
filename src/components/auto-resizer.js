'use strict'

const React = require('react')
const { element, number, oneOfType, string } = require('prop-types')

const AutoResizer = ({ children, content }) => (
  <div className="auto-resizer">
    <div className="content">{content}</div>
    {children}
  </div>
)

AutoResizer.propTypes = {
  children: element.isRequired,
  content: oneOfType([string, number])
}

module.exports = {
  AutoResizer
}
