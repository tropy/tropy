import { createRef } from 'react'
import { mock } from 'node:test'
import { act } from '@testing-library/react'
import { render } from '../support/react.js'
import { OptionList } from '#tropy/components/option.js'

describe('OptionList', () => {
  let values = [1, 2, 3].map(id => ({ id, text: `${id}` }))

  let setup = (props) => {
    let list = createRef()
    let onActivate = mock.fn()

    render(
      <OptionList
        ref={list}
        values={values}
        onActivate={onActivate}
        onSelect={() => {}}
        {...props}/>)

    let move = (cmd) => act(() => list.current[cmd]())

    return { move, onActivate }
  }

  let activated = (fn) => fn.mock.calls.at(-1).arguments[0]

  it('moves the active option and reports it', () => {
    let { move, onActivate } = setup({ active: 2 })

    move('next')
    expect(activated(onActivate)).to.have.property('id', 3)

    move('first')
    expect(activated(onActivate)).to.have.property('id', 1)
  })

  it('wraps around', () => {
    let { move, onActivate } = setup({ active: 3, restrict: 'wrap' })
    move('next')
    expect(activated(onActivate)).to.have.property('id', 1)
  })

  it('deactivates past the end in advisory mode', () => {
    let { move, onActivate } = setup({ active: 3, restrict: 'none' })
    move('next')
    expect(activated(onActivate)).to.be.null
  })
})
