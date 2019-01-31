'use strict'

const React = require('react')
const { bool, node, func, string } = require('prop-types')
const { only } = require('./util')
const cx = require('classnames')


const Tab = ({ children, isActive, isDisabled, onActivate }) => (
  <li
    className={cx('tab', { active: isActive, disabled: isDisabled })}
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
    <ul className={cx('nav', 'tabs', { justified })}>
      {children}
    </ul>
  </nav>
)

Tabs.propTypes = {
  justified: bool,
  children: only(Tab)
}

const TabPane = ({ active, children, className }) => (
  <div className={cx('tab-pane', className)}>
    {children(active)}
  </div>
)


TabPane.propTypes = {
  active: string,
  children: func.isRequired,
  className: string
}

module.exports = {
  Tab,
  TabPane,
  Tabs
}
