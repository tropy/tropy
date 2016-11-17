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

const Tab = ({ children, active }) => (
  <li className={cn({ tab: true, active })}>
    {children}
  </li>
)


Tabs.propTypes = {
  justified: PropTypes.bool,
  children: only(Tab)
}

Tab.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool
}

module.exports = {
  Tabs, Tab
}
