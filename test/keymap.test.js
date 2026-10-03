import { CursorKeyMap } from '#tropy/keymap.js'
import { Cursor } from '#tropy/common/sequence.js'

describe('CursorKeyMap', () => {
  let seq = ['a', 'b', 'c']

  let match = (key, mods = {}, { layout, scrollKeys, id = 'b' } = {}) =>
    new CursorKeyMap(new Cursor(seq, id, { layout }), { scrollKeys })
      .match({ key, ...mods })

  it('maps arrows to cursor commands', () => {
    expect(match('ArrowUp')).to.equal('up')
    expect(match('ArrowDown')).to.equal('down')
    expect(match('ArrowUp', { altKey: true })).to.equal('first')
    expect(match('ArrowDown', { altKey: true })).to.equal('last')
  })

  it('ignores left/right in lists', () => {
    expect(match('ArrowLeft')).to.be.null
    expect(match('ArrowRight', { altKey: true })).to.be.null
  })

  it('maps left/right to row moves in grids', () => {
    let grid = { layout: 'grid' }
    expect(match('ArrowLeft', {}, grid)).to.equal('prev')
    expect(match('ArrowRight', {}, grid)).to.equal('next')
    expect(match('ArrowLeft', { altKey: true }, grid)).to.equal('start')
    expect(match('ArrowRight', { altKey: true }, grid)).to.equal('end')
  })

  it('ignores other modifiers', () => {
    expect(match('ArrowDown', { shiftKey: true, ctrlKey: true, metaKey: true }))
      .to.equal('down')
  })

  it('maps scroll keys only when selecting', () => {
    expect(match('Home')).to.be.null
    expect(match('PageDown')).to.be.null

    let select = { scrollKeys: 'select' }
    expect(match('Home', {}, select)).to.equal('first')
    expect(match('End', {}, select)).to.equal('last')
    expect(match('PageUp', {}, select)).to.equal('pageUp')
    expect(match('PageDown', {}, select)).to.equal('pageDown')
  })

  it('ignores other keys', () => {
    expect(match('Enter')).to.be.null
    expect(match('a')).to.be.null
  })

})
