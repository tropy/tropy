import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { ListNode } from '#tropy/components/list/node.js'

describe('ListNode', () => {
  it('saves only id and name when renamed', () => {
    let onSave = mock.fn()
    let { container } = render(
      <ListNode
        list={{ id: 1, parent: 0, name: 'foo', children: [] }}
        isEditing
        onSave={onSave}>
        {() => null}
      </ListNode>,
      inWindowContext)

    let input = container.querySelector('input')
    fireEvent.change(input, { target: { value: 'bar' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSave.mock.callCount()).to.equal(1)
    expect(onSave.mock.calls[0].arguments[0]).to.eql({ id: 1, name: 'bar' })
  })
})
