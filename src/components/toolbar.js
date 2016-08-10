'use strict'

const React = require('react')
const { PropTypes } = React

const Toolbar = ({ children, draggable }) => (
  <div className={`toolbar ${draggable ? 'draggable' : ''}`}>{children}</div>
)

Toolbar.propTypes = {
  children: PropTypes.node,
  draggable: PropTypes.bool
}

module.exports = {
  Toolbar
}
