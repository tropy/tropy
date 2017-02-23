'use strict'

const React = require('react')
const { element, bool, func, number } = React.PropTypes
const cx = require('classnames')

const IconButton = ({ icon, isActive, isDisabled, tabIndex, ...props }) => (
  <button {...props}
    className={cx({ 'btn': true, 'btn-icon': true, 'active': isActive })}
    tabIndex={tabIndex}
    disabled={isDisabled}>
    {icon}
  </button>
)

IconButton.propTypes = {
  icon: element.isRequired,

  isActive: bool,
  isDisabled: bool,

  tabIndex: number,

  onClick: func,
  onMouseDown: func,
  onMouseUp: func
}

IconButton.defaultProps = {
  tabIndex: -1
}

module.exports = {
  IconButton
}
