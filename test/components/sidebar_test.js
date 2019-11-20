'use strict'

const React = require('react')
const { render } = require('@testing-library/react')
const { Sidebar, SidebarBody } = __require('components/sidebar')

describe('Sidebar', () => {
  it('has sidebar class', () => {
    const { container } = render(<Sidebar/>)
    expect(container.firstChild.classList.contains('sidebar')).to.be.true
  })
  it('has sidebar-body class', () => {
    const { container } = render(<SidebarBody/>)
    expect(container.firstChild.classList.contains('sidebar-body')).to.be.true
  })
})
