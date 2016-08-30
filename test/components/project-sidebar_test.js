'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { mount } = require('../support/intl')

describe('ProjectSidebar', () => {
  const { ProjectSidebar: { WrappedComponent: ProjectSidebar } } =
    __require('components/project-sidebar')
  const { Toolbar } = __require('components/toolbar')

  const project = { name: 'My Research' }

  it('renders a toolbar', () => {
    expect(
      shallow(<ProjectSidebar project={project}/>)
    ).to.contain(<Toolbar draggable/>)
  })

  it('renders a the project name', () => {
    expect(
      mount(<ProjectSidebar project={project}/>).find('h1')
    ).to.contain.text(project.name)
  })
})
