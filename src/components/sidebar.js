import React from 'react'
import { node } from 'prop-types'

export const Sidebar = ({ children }) => (
  <header className="sidebar">{children}</header>
)

Sidebar.propTypes = {
  children: node
}

export const SidebarBody = ({ children, ...props }) => (
  <div className="sidebar-body" {...props}>
    {children}
  </div>
)

SidebarBody.propTypes = {
  children: node
}
