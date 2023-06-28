import { ipcRenderer as ipc } from 'electron'
import { EventEmitter } from 'node:events'
import { existsSync as exists } from 'node:fs'
import { basename, join } from 'node:path'
import { warn } from './common/log.js'
import { darwin } from './common/os.js'
import { Plugins } from './common/plugins.js'
import { delay } from './common/util.js'
import ARGS, { update } from './args.js'
import { StyleSheet } from './res.js'
import debounce from 'lodash.debounce'
import * as dialog from './dialog.js'
import * as json from './common/json.js'
import { WindowControls } from './window-controls.js'

import {
  $$,
  append,
  emit,
  isLiveInput,
  load,
  on,
  off,
  toggle,
  stylesheet,
  remove
} from './dom.js'

const isCommand = darwin ?
  e => e.metaKey && !e.altKey && !e.ctrlKey :
  e => e.ctrlKey && !e.altKey && !e.metaKey

let instance
export { instance as default }

export function createWindowInstance() {
  return new Window()
}

export class Window extends EventEmitter {
  type = basename(window.location.pathname, '.html')

  plugins = new Plugins(ARGS.plugins, {
    dialog,
    json,
    window: this
  })

  unloader = 'close'
  unloaders = []
  hasFinishedUnloading = false


  constructor() {
    if (instance) {
      throw Error('window singleton instance already exists')
    }
    super()
    instance = this
  }

  async init() {
    await Promise.all([
      this.plugins.reload().then(p => p.create()),

      new Promise((resolve) => {
        this.unloaders.push(this.plugins.flush)

        this.handleUnload()
        this.handleTabFocus()
        this.handleIpcEvents()
        this.handleEditorCommands()
        this.handleModifierKeys()
        this.handleMouseButtons()
        this.handleUncaughtExceptions()

        toggle(this.html, process.platform, true)

        if (ARGS.aqua)
          toggle(this.html, ARGS.aqua, true)

        this.setScrollBarStyle()
        this.setZoomLevel()
        this.setFontSize()

        if (ARGS.frameless) {
          toggle(this.html, 'frameless', true)

          toggle(this.html, 'not-maximizable', !ARGS.maximizable)
          toggle(this.html, 'not-minimizable', !ARGS.minimizable)

          if (!darwin) {
            this.controls = new WindowControls()
            this.controls.mount(this)
          }
        }

        resolve()
      }),

      this.style(false)
    ])

    this.send('init')
    this.toggle('init')
  }

  async load() {
    let { store } = await import(`./views/${this.type}.js`)
    this.store = store
    this.send('ready')
    this.toggle('ready')
  }

  close() {
    this.send('close')
  }

  undo() {
    this.send('undo')
  }

  redo() {
    this.send('redo')
  }

  get args() {
    return ARGS
  }

  get body() {
    return document.body
  }

  get html() {
    return document.documentElement
  }

  get theme() {
    return (ARGS.theme !== 'system') ?
      ARGS.theme :
      ARGS.dark ? 'dark' : 'light'
  }

  get stylesheets() {
    let { theme, type } = this
    return [
      StyleSheet.expand(`base-${theme}`),
      StyleSheet.expand(`${type}-${theme}`),
      join(ARGS.data, 'style.css'),
      join(ARGS.data, `style-${theme}.css`)
    ]
  }

  setArgs(args) {
    update(args)
    this.emit('settings.update', args)
  }

  setFontSize(fontSize = ARGS.fontSize) {
    if (this.type !== 'print') {
      this.html.style.fontSize = fontSize
    }
  }

  setScrollBarStyle(scrollbars = ARGS.scrollbars) {
    toggle(this.html, 'scrollbar-style-old-school', scrollbars)
  }

  setZoomLevel(zoom = ARGS.zoom) {
    this.html.style.setProperty('--zoom', zoom)
  }

  handleIpcEvents() {
    ipc
      .on('win', (_, state) => {
        this.toggle(state)
      })
      .on('theme', (_, theme, { dark, contrast, vibrancy } = ARGS) => {
        this.setArgs({ theme, dark, contrast, vibrancy })
        this.style(true)
      })
      .on('fontSize', (_, fontSize) => {
        this.setArgs({ fontSize })
        this.setFontSize(fontSize)
      })
      .on('recent', (_, recent) => {
        this.setArgs({ recent })
      })
      .on('locale', (_, locale) => {
        this.setArgs({ locale })
      })
      .on('debug', (_, debug) => {
        this.setArgs({ debug })
      })
      .on('scrollbars', (_, scrollbars) => {
        this.setArgs({ scrollbars })
        this.setScrollBarStyle(scrollbars)
        this.style(true)
      })
      .on('zoom', (_, zoom) => {
        this.setArgs({ zoom })
        this.setZoomLevel(zoom)
      })
      .on('refresh', () => {
        this.style(true)
      })
      .on('reload', () => {
        this.reload()
      })
      .on('idle', (_, state) => {
        this.emit('idle', state)
      })
      .on('print', (_, data) => {
        this.emit('print', data)
      })
      .on('plugins-reload', async () => {
        this.plugins.clearModuleCache()
        await this.plugins.reload()
        await this.plugins.create()
      })
      .on('global', (_, action) => {
        // TODO use window instance emitter
        emit(document, `global:${action}`)
      })
  }

  handleUnload() {
    on(window, 'beforeunload', event => {
      if (this.hasFinishedUnloading) return
      event.returnValue = false

      if (this.isUnloading) return
      this.isUnloading = true

      this.toggle('unload')

      Promise
        .all(this.unloaders.map(unload => unload()))
        .finally(() => {
          this.hasFinishedUnloading = true

          // Possibly related to electron#7977 closing the window
          // a second time is unreliable if it happens to soon.
          return delay(25).then(() => this.send(this.unloader))
        })
    })
  }

  handleTabFocus() {
    on(document, 'keydown', event => {
      if (event.key === 'Tab' && !event.defaultPrevented) {
        const onTabFocus = ({ target }) => {
          try {
            if (target != null) {
              emit(target, 'tab:focus')
            }
          } finally {
            clearTimeout(tm)
            offTabFocus()
          }
        }

        const offTabFocus = () => {
          off(document.body, 'focusin', onTabFocus)
        }

        const tm = setTimeout(() => {
          // Hit the tab 'gap'! Forward to first tab index?
          offTabFocus()
        }, 50)

        on(document.body, 'focusin', onTabFocus)
      }
    }, { passive: true })
  }

  handleEditorCommands() {
    on(document, 'keydown', event => {
      if (!isCommand(event)) return
      if (event.defaultPrevented) return

      switch (event.key) {
        case 'z':
          if (event.shiftKey) {
            if (isLiveInput(event.target)) this.redo()
            else this.emit('app.redo')
          } else {
            if (isLiveInput(event.target)) this.undo()
            else this.emit('app.undo')
          }
          break

        case 'Z':
        case 'y':
          if (isLiveInput(event.target)) this.redo()
          else this.emit('app.redo')
          break

        default:
          return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
    })
  }

  handleModifierKeys() {
    on(document, 'keydown', event => {
      toggle(this.html, 'alt-key', event.altKey)
      toggle(this.html, 'meta-key', event.metaKey)
      toggle(this.html, 'ctrl-key', event.ctrlKey)
    }, { passive: true, capture: true })

    let up = (event) => {
      toggle(this.html, 'alt-key', event.altKey === true)
      toggle(this.html, 'meta-key', event.metaKey === true)
      toggle(this.html, 'ctrl-key', event.ctrlKey === true)
    }

    on(document, 'keyup', up, { passive: true, capture: true })
    on(window, 'blur', up, { passive: true })
  }

  handleMouseButtons() {
    on(document, 'mousedown', event => {
      if (!event.defaultPrevented) {
        switch (event.button) {
          case 3:
          case 8:
            emit(document, 'global:back')
            break
          case 4:
          case 9:
            emit(document, 'global:forward')
            break
        }
      }
    }, { passive: true, capture: false })
  }

  handleUncaughtExceptions() {
    let handleError = debounce(({ message, stack } = {}) => {
      ipc.send('error', { message, stack })
    }, 250)

    on(window, 'error', (event) => {
      event.preventDefault()
      if (event.error) handleError(event.error)
    })

    on(window, 'unhandledrejection', (event) => {
      event.preventDefault()
      if (event.reason) handleError(event.reason)
    })

    on(window, 'securitypolicyviolation', (e) => {
      warn(`CSP violation for ${e.violatedDirective}: ${e.blockedURI}`)
    })
  }

  reload() {
    this.unloader = 'reload'
    this.send('reload')
  }

  async style(prune = false) {
    if (prune) {
      for (let css of $$('head > link[rel="stylesheet"]'))
        remove(css)
    }

    let { stylesheets } = this
    let loaded = []

    for (let i = 0; i < stylesheets.length; ++i) {
      let src = stylesheets[i]
      if (i < 2 || exists(src)) {
        let css = stylesheet(src)
        loaded.push(load(css, `Load error: ${src}`))
        append(css, document.head)
      }
    }

    toggle(this.html, 'vibrancy', ARGS.vibrancy)

    await Promise.race([
      Promise.all(loaded),
      delay(250)
    ])
  }

  toggle(state, ...args) {
    switch (state) {
      case 'focus':
        toggle(this.html, 'is-blurred', false)
        break
      case 'blur':
        toggle(this.html, 'is-blurred', true)
        break
      case 'maximize':
        toggle(this.html, 'is-maximized', true)
        break
      case 'unmaximize':
        toggle(this.html, 'is-maximized', false)
        break
      case 'init':
        toggle(this.html, 'init', true)
        break
      case 'busy':
        toggle(this.html, 'busy', ...args)
        break
      case 'ready':
        toggle(this.html, 'ready', true)
        break
      case 'disable':
      case 'unload':
        toggle(this.html, 'inactive', true)
        break
      case 'enable':
        toggle(this.html, 'inactive', false)
        break
      case 'enter-full-screen':
        toggle(this.html, 'is-full-screen', true)
        break
      case 'leave-full-screen':
        toggle(this.html, 'is-full-screen', false)
        break
    }

    this.emit('toggle', state)
  }

  maximize() {
    this.send('maximize')
  }

  minimize() {
    this.send('minimize')
  }

  setFixedSize(resizable, ...args) {
    this.send('fixed-size', resizable, ...args)
  }

  get isResizeAnimated() {
    return darwin && ARGS.motion
  }

  preview(file) {
    this.send('preview', file)
  }

  send(type, ...params) {
    ipc.send('wm', type, ...params)
  }
}
