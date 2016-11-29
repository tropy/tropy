'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ProjectSidebar', () => {
  const { ProjectSidebar } = __require('components/project/sidebar')

  const project = { name: 'My Research' }

  it('renders a toolbar when prop is set', () => {
    expect(
      shallow(
        <ProjectSidebar.WrappedComponent project={project} hasToolbar/>
      )
    ).to.have.exactly(1).descendants('Toolbar')
  })

  it('renders the project name', () => {
    expect(
      shallow(
        <ProjectSidebar.WrappedComponent project={project}/>
      ).find('ProjectName')
    ).to.have.prop('name', project.name)
  })
})
