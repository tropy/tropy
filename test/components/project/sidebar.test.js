import { render, inWindowContext } from '../../support/react.js'
import { ProjectSidebar as WrappedSidebar } from '#tropy/components/project/sidebar.js'
import projects from '../../fixtures/projects.js'
import lists from '../../fixtures/lists.js'

describe('ProjectSidebar', () => {
  const ProjectSidebar = WrappedSidebar.WrappedComponent

  it('renders a sidebar with the project name', () => {
    const { element, getByText } = render(
      <ProjectSidebar
        project={projects.tropy}
        lists={lists}/>,
      inWindowContext)

    expect(element())
      .to.have.descendants('.sidebar .project-name')

    expect(getByText(projects.tropy.name)).to.exist
  })
})
