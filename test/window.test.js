import { mock } from 'node:test'
import WIN, { createWindowInstance } from '#tropy/window.js'
import { darwin } from '#tropy/common/os.js'

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
})
