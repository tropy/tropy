'use strict'

const React = require('react')
const { PropTypes } = React

const Toolbar = ({ children}) => (
  <div className="toolbar">{children}</div>
)

Toolbar.propTypes = {
  children: PropTypes.node
}

module.exports = {
  Toolbar
}
