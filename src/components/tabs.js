'use strict'

const React = require('react')
const { PropTypes } = React

const Tabs = ({ children, justified }) => (
  <nav>
    <ul className={`nav tabs ${justified ? 'justified' : ''}`}>
      {children}
    </ul>
  </nav>
)


const Tab = ({ children, active }) => (
  <li className={`${active ? 'active' : ''}`}>
    <a href="#">{children}</a>
  </li>
)


Tabs.propTypes = {
  children: PropTypes.node,
  justified: PropTypes.bool
}

Tab.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool
}

module.exports = {
  Tabs, Tab
}