import { render, inWindowContext } from '../../support/react.cjs'
import { ListTree } from '#tropy/components/list/tree.js'
import lists from '../../fixtures/lists.js'

describe('ListTree', () => {
  it('renders no list for empty parent', () => {
    expect(
      render(
        <ListTree
          parent={lists.empty}
          lists={lists}/>,
        inWindowContext).element())
      .not.to.have.descendants('.list-node')
  })

  it('renders list nodes', () => {
    const { element, getByText } = render((
      <ListTree
        parent={lists.root}
        lists={lists}/>
    ), inWindowContext)

    expect(element())
      .to.have.descendants('.list-node')
      .with.length(lists.root.children.length)

    expect(getByText(lists[1].name)).to.exist
    expect(getByText(lists[2].name)).to.exist
  })
})
