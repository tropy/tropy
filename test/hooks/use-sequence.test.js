import { mock } from 'node:test'
import { fireEvent, renderHook } from '@testing-library/react'
import { render, inWindowContext } from '../support/react.js'
import { useSequence } from '#tropy/hooks/use-sequence.js'
import { create, Selection } from '#tropy/common/selection.js'

describe('useSequence', () => {
  let seq = [{ id: 1 }, { id: 2 }, { id: 3 }]
  let onSelect = mock.fn()

  let List = ({ selection }) => {
    let [, handlers] = useSequence(seq, { selection, onSelect })

    return (
      <ul {...handlers}>
        {seq.map((el, index) => (
          <li key={el.id} data-index={index}/>
        ))}
      </ul>
    )
  }

  // Mouse-down (and click) on the n-th element.
  let press = (selection, n, opts, isClick = false) => {
    let { $$ } = render(<List selection={selection}/>, inWindowContext)
    fireEvent.mouseDown($$('li')[n], { detail: 1, ...opts })

    if (isClick)
      fireEvent.click($$('li')[n], { detail: 1, ...opts })
  }

  beforeEach(() => {
    onSelect.mock.resetCalls()
  })

  it('proposes the next state for selections', () => {
    press(new Selection(create([1]), seq), 2, { shiftKey: true })

    let [next, { mode, target }] = onSelect.mock.calls[0].arguments
    expect(Object.keys(next.selected)).to.eql(['1', '2', '3'])
    expect(mode).to.equal('extend')
    expect(target).to.equal(seq[2])
  })

  it('proposes elements for single selections', () => {
    press(seq[0], 1, { shiftKey: true })
    expect(onSelect.mock.calls[0].arguments[0]).to.equal(seq[1])
  })

  // The props for Scroll.
  let scroll = (selection) =>
    renderHook(() => useSequence(seq, { selection, onSelect }),
      inWindowContext).result.current[0]

  it('proposes clearing on background clicks', () => {
    scroll(create([1, 2])).onClick()
    scroll(seq[1]).onClick()

    let [state, single] = onSelect.mock.calls.map(call => call.arguments[0])
    expect(state.selected).to.eql({})
    expect(single).to.be.null
  })

  it('proposes the cursor on tab focus without a selection', () => {
    // Selecting just the cursor would change this one.
    scroll(create([1, 2])).onTabFocus()
    scroll(null).onTabFocus()

    expect(onSelect.mock.callCount()).to.equal(1)
    expect(onSelect.mock.calls[0].arguments[0]).to.equal(seq[0])
  })

  it('does not propose unchanged selections', () => {
    // A click on a selected element selects it again.
    press(create([1]), 0, {}, true)
    press(seq[0], 0, {}, true)

    expect(onSelect.mock.callCount()).to.equal(0)
  })
})
