import { Input } from '#tropy/components/input.js'

describe('Input', () => {
  // Windows reports AltGr as Ctrl+Alt.
  const altGr = {
    altKey: true,
    ctrlKey: true,
    getModifierState: (mod) => mod === 'AltGraph'
  }

  describe('handleCompletionsKeyDown', () => {
    let press = (key, mods = {}) => {
      let calls = []
      let input = new Input({ value: '' })

      input.setState = () => {}
      input.completions.current = new Proxy({ isVisible: true }, {
        get: (target, cmd) => target[cmd] ?? (() => { calls.push(cmd) })
      })

      input.handleCompletionsKeyDown({ key, ...mods })
      return calls
    }

    it('moves to the first/last completion with Alt', () => {
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
