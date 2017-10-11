'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ProjectSidebar', () => {
  const { ProjectSidebar } = __require('components/project/sidebar')

  const project = { name: 'My Research' }

  it.skip('renders a toolbar when prop is set', () => {
    expect(
      shallow(
        <ProjectSidebar
          project={project}
          keymap={{}}
          lists={{}}
          selectedTags={[]}
          edit={{}}
          context={{}}
          hasToolbar/>
      )
    ).to.have.exactly(1).descendants('Toolbar')
  })

  it.skip('renders the project name', () => {
    expect(
      shallow(
        <ProjectSidebar
          project={project}
          keymap={{}}
          lists={{}}
          selectedTags={[]}
          context={{}}
          edit={{}}/>
      ).find('DropTarget(ProjectName)')
    ).to.have.prop('name', project.name)
  })
})
