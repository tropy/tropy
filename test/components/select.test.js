import { Select } from '#tropy/components/select.js'

describe('Select', () => {
  // Windows reports AltGr as Ctrl+Alt.
  const altGr = {
    altKey: true,
    ctrlKey: true,
    getModifierState: (mod) => mod === 'AltGraph'
  }

  describe('handleKeyDown', () => {
    let press = (key, mods = {}) => {
      let calls = []
      let select = new Select({ onKeyDown: () => false })

      select.completions.current = new Proxy({}, {
        get: (_, cmd) => () => { calls.push(cmd) }
      })

      select.handleKeyDown({
        key,
        preventDefault () {},
        stopPropagation () {},
        nativeEvent: { stopImmediatePropagation () {} },
        ...mods
      })

      return calls
    }

    it('moves to the first/last option with Alt', () => {
      expect(press('ArrowDown')).to.eql(['next'])
      expect(press('ArrowDown', { altKey: true })).to.eql(['last'])
      expect(press('ArrowUp', { altKey: true })).to.eql(['first'])
    })

    it('ignores AltGr', () => {
      expect(press('ArrowDown', altGr)).to.eql(['next'])
      expect(press('ArrowUp', altGr)).to.eql(['prev'])
    })
  })
})
