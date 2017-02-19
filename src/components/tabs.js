'use strict'

const React = require('react')
const { PropTypes } = React
const { only } = require('./util')
const cx = require('classnames')
const { bool, node, func } = PropTypes


const Tab = ({ children, isActive, isDisabled, onActivate }) => (
  <li
    className={cx({ tab: true, active: isActive, disabled: isDisabled })}
    onClick={isDisabled ? null : onActivate}>
    {children}
  </li>
)

Tab.propTypes = {
  children: node,
  isActive: bool,
  isDisabled: bool,
  onActivate: func.isRequired
}


const Tabs = ({ children, justified }) => (
  <nav>
    <ul className={cx({ nav: true, tabs: true, justified })}>
      {children}
    </ul>
  </nav>
)

Tabs.propTypes = {
  justified: bool,
  children: only(Tab)
}


module.exports = {
  Tab,
  Tabs
}
