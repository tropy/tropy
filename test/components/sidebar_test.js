import { render } from '../support/react'
import { Sidebar, SidebarBody } from '../../src/components/sidebar'

describe('Sidebar', () => {
  it('renders sidebar element', () => {
    expect(render(<Sidebar/>).element()).to.have.class('sidebar')
  })
})

describe('SidebarBody', () => {
  it('renders sidebar-body element', () => {
    expect(render(<SidebarBody/>).element()).to.have.class('sidebar-body')
  })
})
