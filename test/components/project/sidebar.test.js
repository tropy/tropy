import { render, inWindowContext } from '../../support/react.js'
import { ProjectSidebar as WrappedSidebar } from '#tropy/components/project/sidebar.js'
const { projects, lists } = F.state

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
