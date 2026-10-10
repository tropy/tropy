import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { ListTree } from '#tropy/components/list/tree.js'
const { lists } = F.state

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

  it('selects unselected list by id on context menu', () => {
    let onClick = mock.fn()

    let { getByText } = render((
      <ListTree
        parent={lists.root}
        lists={lists}
        onClick={onClick}
        onContextMenu={mock.fn()}/>
    ), inWindowContext)

    fireEvent.contextMenu(getByText(lists[1].name))
    expect(onClick.mock.calls[0].arguments).to.eql([lists[1].id])
  })
})
