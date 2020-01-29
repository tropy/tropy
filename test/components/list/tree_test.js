'use strict'

const React = require('react')
const { render, inWindowContext } = require('../../support/react')

describe('ListTree', () => {
  const { ListTree } = __require('components/list/tree')

  it('renders no list nodes by default', () => {
    expect(
      render(
        <ListTree
          parent={F.lists.root}
          lists={F.lists}/>,
        inWindowContext).element())
      .not.to.have.descendants('.list-node')
  })

  it('renders no list for empty parent', () => {
    expect(
      render(
        <ListTree
          isExpanded
          parent={F.lists.empty}
          lists={F.lists}/>,
        inWindowContext).element())
      .not.to.have.descendants('.list-node')
  })

  it('renders list nodes when expanded', () => {
    const { element, getByText } = render((
      <ListTree
        isExpanded
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
