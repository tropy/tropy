import { readFileSync } from 'node:fs'
import { darwin } from '#tropy/common/os.js'
import { Cursor } from '#tropy/common/sequence.js'
import { KeyMap as KeyMapResource } from '#tropy/res.js'
import {
  CursorKeyMap,
  KeyMap,
  altKey,
  anyModifierKey,
  cmdOrCtrlKey,
  compile,
  getKeyState,
  getModifiers,
  getSelectionMode,
  parse
} from '#tropy/keymap.js'

// Windows reports AltGr as Ctrl+Alt.
const altGr = {
  altKey: true,
  ctrlKey: true,
  getModifierState: (mod) => mod === 'AltGraph'
}

describe('parse', () => {
  let mods = (string) => {
    let { alt, ctrl, meta, shift } = parse(string)[0]
    return { alt, ctrl, meta, shift }
  }

  let none = { alt: false, ctrl: false, meta: false, shift: false }
  let cmdOrCtrl = darwin ? { meta: true } : { ctrl: true }

  it('supports Electron modifier names', () => {
    expect(mods('Alt+a')).to.eql({ ...none, alt: true })
    expect(mods('Option+a')).to.eql({ ...none, alt: true })
    expect(mods('Ctrl+a')).to.eql({ ...none, ctrl: true })
    expect(mods('Control+a')).to.eql({ ...none, ctrl: true })
    expect(mods('Cmd+a')).to.eql({ ...none, meta: true })
    expect(mods('Command+a')).to.eql({ ...none, meta: true })
    expect(mods('Meta+a')).to.eql({ ...none, meta: true })
    expect(mods('Super+a')).to.eql({ ...none, meta: true })
    expect(mods('Shift+a')).to.eql({ ...none, shift: true })
    expect(mods('CmdOrCtrl+a')).to.eql({ ...none, ...cmdOrCtrl })
    expect(mods('CommandOrControl+a')).to.eql({ ...none, ...cmdOrCtrl })
  })

  it('ignores modifier case', () => {
    expect(mods('SHIFT+cmdorctrl+a')).to.eql({
      ...none, ...cmdOrCtrl, shift: true
    })
  })

  it('rejects unknown modifiers', () => {
    expect(() => parse('Item+a')).to.throw()
    expect(() => parse('Comand+a')).to.throw()
    expect(() => parse('Constructor+a')).to.throw()
    expect(() => parse(['Ctrl+a', 'Ctl+b'])).to.throw()
  })

  it('supports Electron key names', () => {
    let key = (string) => parse(string)[0].key

    expect(key('Up')).to.equal('ArrowUp')
    expect(key('Down')).to.equal('ArrowDown')
    expect(key('Left')).to.equal('ArrowLeft')
    expect(key('Right')).to.equal('ArrowRight')
    expect(key('Esc')).to.equal('Escape')
    expect(key('Return')).to.equal('Enter')
    expect(key('Space')).to.equal(' ')
    expect(key('CmdOrCtrl+Plus')).to.equal('+')
  })

  it('ignores Electron key name case', () => {
    expect(parse('esc')[0].key).to.equal('Escape')
    expect(parse('Shift+UP')[0].key).to.equal('ArrowUp')
  })

  it('keeps DOM key names', () => {
    expect(parse('ArrowUp')[0].key).to.equal('ArrowUp')
    expect(parse('Escape')[0].key).to.equal('Escape')
    expect(parse('Enter')[0].key).to.equal('Enter')
  })

  it('compiles the bundled keymaps', () => {
    let data = KeyMapResource.parse(
      readFileSync(KeyMapResource.expand('renderer')))

    for (let platform in data.en) {
      expect(() => compile(data.en[platform]), platform).not.to.throw()
    }
  })
})

describe('getModifiers', () => {
  let none = { alt: false, ctrl: false, meta: false, shift: false }

  it('returns booleans for all modifiers', () => {
    expect(getModifiers({})).to.eql(none)
    expect(getModifiers({
      altKey: true,
      ctrlKey: true,
      metaKey: true,
      shiftKey: true
    })).to.eql({ alt: true, ctrl: true, meta: true, shift: true })
  })

  it('clears Ctrl+Alt when AltGr is pressed', () => {
    expect(getModifiers({
      altKey: true,
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      getModifierState: (mod) => mod === 'AltGraph'
    })).to.eql({ ...none, meta: true, shift: true })
  })
})

describe('KeyMap', () => {
  let keymap = new KeyMap({
    all: 'Ctrl+a',
    undo: 'Ctrl+z',
    redo: 'Ctrl+Shift+z',
    merge: 'Ctrl+Shift+M'
  })

  let match = (key, mods = {}) =>
    keymap.match({
      key,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...mods
    })

  it('matches letters regardless of CapsLock', () => {
    expect(match('a', { ctrlKey: true })).to.equal('all')
    expect(match('A', { ctrlKey: true })).to.equal('all')
  })

  it('matches letters regardless of spec case', () => {
    expect(match('M', { ctrlKey: true, shiftKey: true })).to.equal('merge')
    expect(match('m', { ctrlKey: true, shiftKey: true })).to.equal('merge')
  })

  it('distinguishes letters by shift key', () => {
    expect(match('Z', { ctrlKey: true })).to.equal('undo')
    expect(match('z', { ctrlKey: true, shiftKey: true })).to.equal('redo')
    expect(match('M', { ctrlKey: true })).to.be.null
  })

  it('ignores events during IME composition', () => {
    expect(match('a', { ctrlKey: true, isComposing: true })).to.be.null
  })

  it('ignores React events during IME composition', () => {
    expect(match('a', { ctrlKey: true, nativeEvent: { isComposing: true } }))
      .to.be.null
  })

  describe('punctuation', () => {
    let keymap = new KeyMap({
      find: '/',
      zoomToFit: 'Ctrl+0',
      quicktool: 'Space',
      colon: 'Shift+;'
    })

    let match = (key, mods = {}) =>
      keymap.match({ key, ...mods })

    it('ignores Shift unless specified', () => {
      expect(match('/')).to.equal('find')
      expect(match('/', { shiftKey: true })).to.equal('find') // German
      expect(match('0', { ctrlKey: true, shiftKey: true }))
        .to.equal('zoomToFit') // AZERTY
    })

    it('requires Shift if specified', () => {
      expect(match(';', { shiftKey: true })).to.equal('colon')
      expect(match(';')).to.be.null
    })

    it('does not ignore Shift for Space', () => {
      expect(match(' ')).to.equal('quicktool')
      expect(match(' ', { shiftKey: true })).to.be.null
    })
  })

  describe('non-Latin layouts', () => {
    let keymap = new KeyMap({
      copy: 'Ctrl+c',
      italic: 'Ctrl+i',
      zoomToFit: 'Ctrl+0',
      rotate: 'Ctrl+['
    })

    let match = (key, code) =>
      keymap.match({ key, code, ctrlKey: true })

    it('falls back to the physical key for non-ASCII characters', () => {
      expect(match('с', 'KeyC')).to.equal('copy') // Cyrillic
      expect(match('С', 'KeyC')).to.equal('copy') // Cyrillic, CapsLock
      expect(match('à', 'Digit0')).to.equal('zoomToFit') // AZERTY
      expect(match('ü', 'BracketLeft')).to.equal('rotate') // German
    })

    it('prefers the layout key for ASCII characters', () => {
      expect(match('c', 'KeyI')).to.equal('copy') // Dvorak
    })

    it('does not match when the physical key is unknown', () => {
      expect(match('с')).to.be.null
      expect(match('с', 'IntlRo')).to.be.null
    })
  })

  describe('AltGr', () => {
    let keymap = new KeyMap({
      bracket: '[',
      lift: 'Ctrl+Alt+['
    })

    it('ignores Ctrl+Alt when AltGr is pressed', () => {
      expect(keymap.match({ key: '[', ...altGr })).to.equal('bracket')
    })

    it('matches Ctrl+Alt without AltGr', () => {
      expect(keymap.match({
        ...altGr,
        key: '[',
        getModifierState: () => false
      })).to.equal('lift')
    })
  })
})

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

  it('ignores AltGr', () => {
    expect(match('ArrowDown', altGr)).to.equal('down')
    expect(match('ArrowUp', altGr)).to.equal('up')
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

describe('getSelectionMode', () => {
  let meta = darwin ? { metaKey: true } : { ctrlKey: true }

  it('maps modifier keys to selection modes', () => {
    expect(getSelectionMode({})).to.equal('replace')
    expect(getSelectionMode(meta)).to.equal('toggle')
    expect(getSelectionMode({ shiftKey: true })).to.equal('extend')
    expect(getSelectionMode({ ...meta, shiftKey: true })).to.equal('flip')
  })

  it('ignores AltGr', () => {
    expect(getSelectionMode(altGr)).to.equal('replace')
    expect(getSelectionMode({ ...altGr, shiftKey: true })).to.equal('extend')
  })
})

describe('anyModifierKey', () => {
  it('detects modifier keys', () => {
    expect(anyModifierKey({})).to.be.false
    expect(anyModifierKey({ shiftKey: true })).to.be.true
    expect(anyModifierKey({ altKey: true })).to.be.true
  })

  it('ignores AltGr', () => {
    expect(anyModifierKey(altGr)).to.be.false
    expect(anyModifierKey({ ...altGr, shiftKey: true })).to.be.true
  })
})

describe('altKey', () => {
  it('detects the Alt key', () => {
    expect(altKey({})).to.be.false
    expect(altKey({ altKey: true })).to.be.true
  })

  it('ignores AltGr', () => {
    expect(altKey(altGr)).to.be.false
  })
})

describe('cmdOrCtrlKey', () => {
  let meta = darwin ? { metaKey: true } : { ctrlKey: true }

  it('detects the platform meta key', () => {
    expect(cmdOrCtrlKey({})).to.be.false
    expect(cmdOrCtrlKey(meta)).to.be.true
  })

  it('ignores AltGr', () => {
    expect(cmdOrCtrlKey(altGr)).to.be.false
  })
})

describe('getKeyState', () => {
  it('returns normalized modifiers and repeat', () => {
    expect(getKeyState({ ...altGr, shiftKey: true, repeat: true })).to.eql({
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      repeat: true
    })
  })
})
