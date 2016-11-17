'use strict'

const React = require('react')
const { PropTypes } = React
const { only } = require('./util')
const cn = require('classnames')

const Tabs = ({ children, justified }) => (
  <nav>
    <ul className={cn({ nav: true, tabs: true, justified })}>
      {children}
    </ul>
  </nav>
)

const Tab = ({ children, active, onActivate }) => (
  <li className={cn({ tab: true, active })} onClick={onActivate}>
    {children}
  </li>
)


Tabs.propTypes = {
  justified: PropTypes.bool,
  children: only(Tab)
}

Tab.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool,
  onActivate: PropTypes.func.isRequired
}

module.exports = {
  Tabs, Tab
}
