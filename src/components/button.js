'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')

const IconButton = ({ classes, icon, ...props }) => (
  <button {...props}
    className={cn({ ...classes, 'btn': true, 'btn-icon': true })}>
    {icon}
  </button>
)

IconButton.propTypes = {
  classes: PropTypes.object,
  icon: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func
}

module.exports = {
  IconButton
}
