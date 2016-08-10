'use strict'

const React = require('react')
const { PropTypes } = React

const Button = ({ children, classes }) => (
  <button className={`${classes}`}>{children}</button>
)

Button.propTypes = {
  children: PropTypes.element,
  classes: PropTypes.string
}

module.exports = { Button }
