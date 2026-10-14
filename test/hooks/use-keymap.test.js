import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useKeyDown, useKeyMap } from '#tropy/hooks/use-keymap.js'
import { KeyMap } from '#tropy/keymap.js'
import { createStore, withStore } from '../support/react.js'

describe('useKeyDown', () => {
  let keymap = new KeyMap({ open: 'Enter', delete: 'Backspace' })

  let Keys = ({ handlers }) => (
    <div tabIndex={-1} onKeyDown={useKeyDown(keymap, handlers)}/>
  )

  let press = (handlers, key) => {
    let node = render(<Keys handlers={handlers}/>).container.firstChild
    return !fireEvent.keyDown(node, { key })
  }

  it('handles matched commands with a handler', () => {
    let open = mock.fn()
    expect(press({ open }, 'Enter')).to.be.true
    expect(open.mock.callCount()).to.equal(1)
  })

  it('does not handle commands without a handler', () => {
    expect(press({ open: mock.fn() }, 'Backspace')).to.be.false
    expect(press({ delete: false }, 'Backspace')).to.be.false
  })

  it('passes all commands to a single handler', () => {
    let handler = mock.fn()
    expect(press(handler, 'Backspace')).to.be.true
    expect(handler.mock.calls[0].arguments[1]).to.equal('delete')
    expect(press(handler, 'a')).to.be.false
  })

  it('does not handle commands if the handler returns false', () => {
    let open = mock.fn(() => false)
    expect(press({ open }, 'Enter')).to.be.false
    expect(open.mock.callCount()).to.equal(1)
  })

  it('does not handle anything without handlers', () => {
    expect(press(null, 'Enter')).to.be.false
  })
})

describe('useKeyMap', () => {
  let store = createStore({
    keymap: {
      A: new KeyMap({ expand: 'ArrowRight' }),
      B: new KeyMap({ open: 'Enter', contract: 'ArrowRight' })
    }
  })

  let Keys = ({ names, handlers }) => (
    <div tabIndex={-1} onKeyDown={useKeyMap(names, handlers)}/>
  )

  let press = (names, handlers, key) => {
    let node = render(<Keys names={names} handlers={handlers}/>, withStore(store))
      .container.firstChild
    fireEvent.keyDown(node, { key })
  }

  it('lets the first section with a matching binding decide', () => {
    let expand = mock.fn()
    let contract = mock.fn()
    let open = mock.fn()

    press(['A', 'B'], { expand, contract, open }, 'ArrowRight')
    press(['A', 'B'], { expand, contract, open }, 'Enter')

    expect(expand.mock.callCount()).to.equal(1)
    expect(contract.mock.callCount()).to.equal(0)
    expect(open.mock.callCount()).to.equal(1)
  })
})
