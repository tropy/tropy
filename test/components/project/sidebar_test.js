import { render, inWindowContext } from '../../support/react'
import { ProjectSidebar as WrappedSidebar } from '../../../src/components/project/sidebar'

describe('ProjectSidebar', () => {
  const ProjectSidebar = WrappedSidebar.WrappedComponent
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
