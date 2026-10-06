import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useCursorKeys } from '#tropy/hooks/use-cursor-keys.js'
import { Cursor } from '#tropy/common/sequence.js'

describe('useCursorKeys', () => {
  let onMove = mock.fn()

  let List = ({ cursor, ...options }) => {
    let onKeyDown = useCursorKeys(cursor, { onMove, ...options })
    return <ul tabIndex={-1} onKeyDown={onKeyDown}/>
  }

  let setup = (props) =>
    render(<List {...props}/>).container.firstChild

  let press = (node, key, mods = {}) =>
    !fireEvent.keyDown(node, { key, ...mods })

  let seq = ['a', 'b', 'c']

  beforeEach(() => {
    onMove.mock.resetCalls()
  })

  it('moves the cursor and reports the modifiers', () => {
    let node = setup({ cursor: new Cursor(seq, 'b') })

    expect(press(node, 'ArrowDown', { shiftKey: true })).to.be.true
    let [target, mods] = onMove.mock.calls[0].arguments
    expect(target).to.equal('c')
    expect(mods).to.include({ cmd: 'down', shiftKey: true, altKey: false })
  })

  it('moves to the edges with alt', () => {
    let node = setup({ cursor: new Cursor(seq, 'b') })

    press(node, 'ArrowUp', { altKey: true })
    expect(onMove.mock.calls[0].arguments[0]).to.equal('a')
  })

  it('leaves scroll keys to the browser by default', () => {
    let node = setup({ cursor: new Cursor(seq, 'b') })
    expect(press(node, 'End')).to.be.false
    expect(onMove.mock.callCount()).to.equal(0)
  })

  it('moves with scroll keys when selecting', () => {
    let node = setup({ cursor: new Cursor(seq, 'b'), scrollKeys: 'select' })
    expect(press(node, 'End')).to.be.true
    expect(onMove.mock.calls[0].arguments[0]).to.equal('c')
  })

  it('runs the custom key handler first', () => {
    let onKeyDown = mock.fn((event) => {
      if (event.key === 'ArrowDown') event.preventDefault()
    })

    let node = setup({ cursor: new Cursor(seq, 'b'), onKeyDown })

    expect(press(node, 'ArrowDown')).to.be.true
    expect(onKeyDown.mock.callCount()).to.equal(1)
    expect(onMove.mock.callCount()).to.equal(0)

    press(node, 'ArrowUp')
    expect(onKeyDown.mock.callCount()).to.equal(2)
    expect(onMove.mock.callCount()).to.equal(1)
  })

  it('leaves left/right to the component in lists', () => {
    let node = setup({ cursor: new Cursor(seq, 'b') })
    expect(press(node, 'ArrowLeft')).to.be.false
  })

  it('moves left/right in grids', () => {
    let node = setup({ cursor: new Cursor(seq, 'b', { layout: 'grid' }) })

    press(node, 'ArrowLeft')
    expect(onMove.mock.calls[0].arguments[0]).to.equal('a')
  })

  it('does not handle cursor keys in empty sequences', () => {
    let node = setup({ cursor: new Cursor([], null) })
    expect(press(node, 'ArrowDown')).to.be.false
  })

  it('handles but does not report staying put', () => {
    let node = setup({ cursor: new Cursor(seq, 'c') })
    expect(press(node, 'ArrowDown')).to.be.true
    expect(onMove.mock.callCount()).to.equal(0)
  })

  it('does not handle cursor keys if onMove declines', () => {
    let node = setup({
      cursor: new Cursor(seq, 'b'),
      onMove: (_, { ctrlKey }) => (ctrlKey ? false : undefined)
    })

    expect(press(node, 'ArrowDown', { ctrlKey: true })).to.be.false
    expect(press(node, 'ArrowDown')).to.be.true
  })

  it('does not handle cursor keys without a target', () => {
    let node = setup({ cursor: new Cursor(seq, 'c', { restrict: 'none' }) })
    expect(press(node, 'ArrowDown')).to.be.false
    expect(onMove.mock.callCount()).to.equal(0)
  })
})
