'use strict'

const React = require('react')
const { render } = require('../support/react')

describe('Sidebar', () => {
  const { Sidebar } = __require('components/sidebar')

  it('renders .sidebar container', () => {
    expect(render(<Sidebar/>).element()).to.have.class('sidebar')
  })
})

describe('SidebarBody', () => {
  const { SidebarBody } = __require('components/sidebar')

  it('renders .sidebar-body container', () => {
    expect(render(<SidebarBody/>).element()).to.have.class('sidebar-body')
  })
})
