'use strict'

const React = require('react')
const cx = require('classnames')
const { element, number, oneOfType, string } = require('prop-types')


const AutoResizer = ({ children, className, content }) => (
  <div className={cx(className, 'auto-resizer')}>
    <div className="content">{content}</div>
    {children}
  </div>
)

AutoResizer.propTypes = {
  className: string,
  children: element.isRequired,
  content: oneOfType([string, number])
}

module.exports = {
  AutoResizer
}
