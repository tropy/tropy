import { getCursorCommand } from '#tropy/keymap.js'

describe('getCursorCommand', () => {
  let cmd = (key, mods = {}, options) =>
    getCursorCommand({ key, ...mods }, options)

  it('maps arrows to cursor commands', () => {
    expect(cmd('ArrowUp')).to.equal('up')
    expect(cmd('ArrowDown')).to.equal('down')
    expect(cmd('ArrowUp', { altKey: true })).to.equal('first')
    expect(cmd('ArrowDown', { altKey: true })).to.equal('last')
  })

  it('maps left/right to collapse/expand in lists', () => {
    expect(cmd('ArrowLeft')).to.equal('collapse')
    expect(cmd('ArrowRight')).to.equal('expand')
    expect(cmd('ArrowLeft', { altKey: true })).to.be.null
  })

  it('maps left/right to row moves in grids', () => {
    let grid = { layout: 'grid' }
    expect(cmd('ArrowLeft', {}, grid)).to.equal('prev')
    expect(cmd('ArrowRight', {}, grid)).to.equal('next')
    expect(cmd('ArrowLeft', { altKey: true }, grid)).to.equal('start')
    expect(cmd('ArrowRight', { altKey: true }, grid)).to.equal('end')
  })

  it('ignores other modifiers', () => {
    expect(cmd('ArrowDown', { shiftKey: true, ctrlKey: true, metaKey: true }))
      .to.equal('down')
  })

  it('maps scroll keys only when selecting', () => {
    expect(cmd('Home')).to.be.null
    expect(cmd('PageDown')).to.be.null

    let select = { scrollKeys: 'select' }
    expect(cmd('Home', {}, select)).to.equal('first')
    expect(cmd('End', {}, select)).to.equal('last')
    expect(cmd('PageUp', {}, select)).to.equal('pageUp')
    expect(cmd('PageDown', {}, select)).to.equal('pageDown')
  })

  it('ignores other keys', () => {
    expect(cmd('Enter')).to.be.null
    expect(cmd('a')).to.be.null
  })
})
