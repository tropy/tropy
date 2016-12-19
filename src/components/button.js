'use strict'

const React = require('react')
const { PropTypes } = React

const IconButton = ({ icon, ...props }) => (
  <button {...props} className="btn btn-icon">
    {icon}
  </button>
)

IconButton.propTypes = {
  icon: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func
}

module.exports = {
  IconButton
}
