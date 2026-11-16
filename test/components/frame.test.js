import { inWindowContext, render } from '../support/react.js'
import { Frame } from '#tropy/components/frame.js'
import { has } from '#tropy/dom.js'

describe('Frame', () => {
  let classes = ['ctrl-key', 'meta-key']
  let unmount

  afterEach(() => {
    unmount?.()
    unmount = null
  })

  let load = () =>
    new Promise(resolve => {
      ({ unmount } = render(
        <Frame onLoad={resolve}/>,
        inWindowContext))
    })

  let press = (type, init) =>
    document.dispatchEvent(new KeyboardEvent(type, init))

  let active = (doc) =>
    classes.filter(name => has(doc.documentElement, name))

  it('tracks modifier keys', async () => {
    let doc = await load()

    press('keydown', { ctrlKey: true, metaKey: true })
    expect(active(doc)).to.eql(['ctrl-key', 'meta-key'])

    press('keyup', {})
    expect(active(doc)).to.eql([])
  })

  it('ignores AltGr', async () => {
    let doc = await load()

    // Windows reports AltGr as Ctrl+Alt.
    let altGr = { ctrlKey: true, altKey: true, modifierAltGraph: true }
    expect(new KeyboardEvent('keydown', altGr).getModifierState('AltGraph'))
      .to.be.true

    press('keydown', altGr)
    expect(active(doc)).to.eql([])
  })
})
