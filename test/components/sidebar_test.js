'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Sidebar', () => {
  const { Sidebar } = __require('components/sidebar')

  it('has id sidebar', () => {
    expect(shallow(<Sidebar/>)).to.have.id('sidebar')
  })

})

describe('ProjectSidebar', () => {
  const { ProjectSidebar } = __require('components/sidebar')
  const { Toolbar } = __require('components/toolbar')

  const project = { name: 'My Research' }

  it('renders a toolbar', () => {
    expect(
      shallow(<ProjectSidebar project={project}/>)
    ).to.contain(<Toolbar draggable/>)
  })

  it('renders a the project name', () => {
    expect(
      shallow(<ProjectSidebar project={project}/>).find('h1')
    ).to.contain.text(project.name)
  })
})
