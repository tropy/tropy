'use strict'

const React = require('react')
const { node } = require('prop-types')

const Sidebar = ({ children }) => (
  <header id="sidebar">{children}</header>
)

Sidebar.propTypes = {
  children: node
}

const SidebarBody = ({ children, ...props }) => (
  <div className="sidebar-body" {...props}>
    {children}
  </div>
)

SidebarBody.propTypes = {
  children: node
}

module.exports = {
  Sidebar,
  SidebarBody
}
