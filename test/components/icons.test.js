import { render, inWindowContext } from '../support/react.js'
import { FormattedIcon, Icon, IconLock, IconMaze } from '#tropy/components/icons.js'

describe('IconLock', () => {
  it('renders the lock icon SVG', () => {
    expect(
      render(<IconLock/>, inWindowContext).element())
      .to.have.class('icon')
      .and.class('icon-lock')
      .and.have.descendant('svg')
  })
})

describe('Icon', () => {
  it('renders icons by name and passes the title as is', () => {
    for (let name of ['Lock', 'IconLock']) {
      expect(
        render(<Icon name={name} title="project.readOnly"/>, inWindowContext).element())
        .to.have.class('icon-lock')
        .and.attr('title', 'project.readOnly')
    }
  })

  it('renders nothing for unknown names', () => {
    for (let name of ['NoSuchIcon', 'constructor']) {
      expect(render(<Icon name={name}/>, inWindowContext).element())
        .to.be.null
    }
  })
})

describe('FormattedIcon', () => {
  it('formats the title', () => {
    let { title } =
      render(<FormattedIcon name="Lock" title="project.readOnly"/>, inWindowContext).element()

    expect(title).to.match(/^Your project file is locked/)
  })
})

describe('IconMaze', () => {
  it('passes props to the svg', () => {
    let d = (seed) =>
      render(<IconMaze seed={seed}/>, inWindowContext)
        .element().querySelector('path').getAttribute('d')

    expect(d('f6d9c2e4-8a43-4c7b-9a1e-2b5d7c3f1a90'))
      .not.to.equal(d('0b7e5a12-3c4d-4e6f-8a9b-1c2d3e4f5a6b'))
  })
})
