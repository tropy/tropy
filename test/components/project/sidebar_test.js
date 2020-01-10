'use strict'

const React = require('react')
const { render, inWindowContext } = require('../../support/react')

describe('ProjectSidebar', () => {
  const ProjectSidebar =
    __require('components/project/sidebar').ProjectSidebar.WrappedComponent

  it('renders a sidebar with the project name', () => {
    const { element, getByText } = render(
      <ProjectSidebar
        project={F.projects.tropy}
        lists={F.lists}/>,
      inWindowContext)

    expect(element())
      .to.have.descendants('.sidebar .project-name')

    expect(getByText(F.projects.tropy.name)).to.exist
  })
})
