'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ProjectSidebar', () => {
  const { ProjectSidebar } = __require('components/project-sidebar')

  const project = { name: 'My Research' }

  it('renders a toolbar', () => {
    expect(
      shallow(
        <ProjectSidebar.WrappedComponent project={project}/>
      )
    ).to.have.exactly(1).descendants('Toolbar')
  })

  it('renders a the project name', () => {
    expect(
      shallow(
        <ProjectSidebar.WrappedComponent project={project}/>
      ).find('h1 Editable')
    ).to.have.prop('value', project.name)
  })
})
