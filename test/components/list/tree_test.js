import { render, inWindowContext } from '../../support/react.js'
import { ListTree } from '#internal/components/list/tree.js'

describe('ListTree', () => {
  it('renders no list for empty parent', () => {
    expect(
      render(
        <ListTree
          parent={F.lists.empty}
          lists={F.lists}/>,
        inWindowContext).element())
      .not.to.have.descendants('.list-node')
  })

  it('renders list nodes', () => {
    const { element, getByText } = render((
      <ListTree
        parent={F.lists.root}
        lists={F.lists}/>
    ), inWindowContext)

    expect(element())
      .to.have.descendants('.list-node')
      .with.length(F.lists.root.children.length)

    expect(getByText(F.lists[1].name)).to.exist
    expect(getByText(F.lists[2].name)).to.exist
  })
})
