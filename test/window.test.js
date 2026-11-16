import { mock } from 'node:test'
import WIN, { createWindowInstance } from '#tropy/window.js'
import { darwin } from '#tropy/common/os.js'
import { has } from '#tropy/dom.js'

// Windows reports AltGr as Ctrl+Alt.
const altGr = {
  altKey: true,
  ctrlKey: true,
  getModifierState: (mod) => mod === 'AltGraph'
}

describe('Window', () => {
  let win = WIN || createWindowInstance()

  describe('handleEditorCommand', () => {
    let cmdOrCtrl = darwin ? { metaKey: true } : { ctrlKey: true }
    let emit, undo, redo

    beforeEach(() => {
      emit = mock.method(win, 'emit', () => {})
      undo = mock.method(win, 'undo', () => {})
      redo = mock.method(win, 'redo', () => {})
    })

    afterEach(() => {
      mock.restoreAll()
    })

    let press = (key, mods = {}) => {
      let event = {
        key,
        target: document.body,
        defaultPrevented: false,
        preventDefault: mock.fn(),
        stopImmediatePropagation: mock.fn(),
        ...cmdOrCtrl,
        ...mods
      }

      win.handleEditorCommand(event)
      return event
    }

    let emitted = () =>
      emit.mock.calls.map(call => call.arguments[0])

    it('emits undo and redo', () => {
      press('z')
      press('Z', { shiftKey: true })
      expect(emitted()).to.eql(['app.undo', 'app.redo'])
    })

    it('handles the event', () => {
      let event = press('z')
      expect(event.preventDefault.mock.callCount()).to.equal(1)
      expect(event.stopImmediatePropagation.mock.callCount()).to.equal(1)
    })

    it('undoes with CapsLock', () => {
      press('Z')
      press('z', { shiftKey: true })
      expect(emitted()).to.eql(['app.undo', 'app.redo'])
    })

    it('undoes on non-Latin layouts', () => {
      press('я', { code: 'KeyZ' })
      expect(emitted()).to.eql(['app.undo'])
    })

    it('redoes with Ctrl+Y except on macOS', () => {
      press('y', { ctrlKey: true, metaKey: false })
      expect(emitted()).to.eql(darwin ? [] : ['app.redo'])
    })

    it('uses native undo and redo in live inputs', () => {
      let target = document.createElement('input')
      press('z', { target })
      press('z', { target, shiftKey: true })
      expect(undo.mock.callCount()).to.equal(1)
      expect(redo.mock.callCount()).to.equal(1)
      expect(emitted()).to.eql([])
    })

    it('ignores handled events', () => {
      press('z', { defaultPrevented: true })
      expect(emitted()).to.eql([])
    })

    it('ignores other keys', () => {
      let event = press('x')
      expect(emitted()).to.eql([])
      expect(event.preventDefault.mock.callCount()).to.equal(0)
    })
  })

  describe('modifier keys', () => {
    let classes = ['alt-key', 'ctrl-key', 'meta-key', 'full-screen-menu']
    let isFullScreen = win.isFullScreen

    let active = () =>
      classes.filter(name => has(win.html, name))

    afterEach(() => {
      win.html.classList.remove(...classes)
      win.isFullScreen = isFullScreen
    })

    it('tracks modifier keys', () => {
      win.handleModifierKeyDown({ altKey: true, ctrlKey: true, metaKey: true })
      expect(active()).to.eql(['alt-key', 'ctrl-key', 'meta-key'])

      win.updateModifierKeys({ ctrlKey: true })
      expect(active()).to.eql(['ctrl-key'])

      win.updateModifierKeys({}) // blur
      expect(active()).to.eql([])
    })

    it('ignores AltGr', () => {
      win.handleModifierKeyDown(altGr)
      expect(active()).to.eql([])
    })

    it('toggles the full screen menu with Alt', () => {
      win.isFullScreen = true
      win.handleModifierKeyDown({ altKey: true })
      expect(has(win.html, 'full-screen-menu')).to.be.true
    })

    it('does not toggle the full screen menu with AltGr', () => {
      win.isFullScreen = true
      win.handleModifierKeyDown(altGr)
      expect(has(win.html, 'full-screen-menu')).to.be.false
    })
  })
})
