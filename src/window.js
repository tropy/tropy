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

import {
  $$,
  append,
  emit,
  create,
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

        toggle(document.documentElement, process.platform, true)

        let { aqua, frameless } = ARGS

        if (aqua)
          toggle(document.documentElement, aqua, true)

        this.setScrollBarStyle()
        this.setZoomLevel()
        this.setFontSize()

        if (frameless) {
          toggle(document.documentElement, 'frameless', true)

          if (!darwin) this.createWindowControls()
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

  setFontSize(fontSize = ARGS.fontSize) {
    if (this.type !== 'print') {
      document.documentElement.style.fontSize = fontSize
    }
  }

  setScrollBarStyle(scrollbars = ARGS.scrollbars) {
    toggle(document.documentElement, 'scrollbar-style-old-school', scrollbars)
  }

  setZoomLevel(zoom = ARGS.zoom) {
    document.documentElement.style.setProperty('--zoom', zoom)
  }

  handleIpcEvents() {
    ipc
      .on('win', (_, state) => {
        this.toggle(state)
      })
      .on('theme', (_, theme, { dark, contrast, vibrancy } = ARGS) => {
        update({ theme, dark, contrast, vibrancy })
        this.style(true)
        this.emit('settings.update', { theme, dark, contrast, vibrancy })
      })
      .on('fontSize', (_, fontSize) => {
        update({ fontSize })
        this.setFontSize(fontSize)
        this.emit('settings.update', { fontSize })
      })
      .on('recent', (_, recent) => {
        update({ recent })
        this.emit('settings.update', { recent })
      })
      .on('locale', (_, locale) => {
        update({ locale })
        this.emit('settings.update', { locale })
      })
      .on('debug', (_, debug) => {
        update({ debug })
        this.emit('settings.update', { debug })
      })
      .on('scrollbars', (_, scrollbars) => {
        update({ scrollbars })
        this.setScrollBarStyle(scrollbars)
        this.style(true)
        this.emit('settings.update', { scrollbars })
      })
      .on('zoom', (_, zoom) => {
        update({ zoom })
        this.setZoomLevel(zoom)
        this.emit('settings.update', { zoom })
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
      toggle(document.documentElement, 'alt-key', event.altKey)
      toggle(document.documentElement, 'meta-key', event.metaKey)
      toggle(document.documentElement, 'ctrl-key', event.ctrlKey)
    }, { passive: true, capture: true })

    on(document, 'keyup', up, { passive: true, capture: true })
    on(window, 'blur', up, { passive: true })

    function up(event) {
      toggle(document.documentElement, 'alt-key', event.altKey === true)
      toggle(document.documentElement, 'meta-key', event.metaKey === true)
      toggle(document.documentElement, 'ctrl-key', event.ctrlKey === true)
    }
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

  createWindowControls() {
    this.controls = {
      close: create('button', { tabindex: '-1', class: 'close' }),
      min: create('button', { tabindex: '-1', class: 'minimize' }),
      max: create('button', { tabindex: '-1', class: 'maximize' })
    }

    on(this.controls.close, 'click', this.close)

    if (ARGS.minimizable)
      on(this.controls.min, 'click', this.minimize)
    else
      toggle(document.documentElement, 'not-minimizable', true)

    if (ARGS.maximizable)
      on(this.controls.max, 'click', this.maximize)
    else
      toggle(document.documentElement, 'not-maximizable', true)

    let div = create('div', { class: 'window-controls' })

    append(this.controls.close, div)
    append(this.controls.min, div)
    append(this.controls.max, div)
    append(div, document.body)
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

    toggle(document.documentElement, 'vibrancy', ARGS.vibrancy)

    await Promise.race([
      Promise.all(loaded),
      delay(250)
    ])
  }

  toggle(state, ...args) {
    switch (state) {
      case 'focus':
        toggle(document.documentElement, 'is-blurred', false)
        break
      case 'blur':
        toggle(document.documentElement, 'is-blurred', true)
        break
      case 'maximize':
        toggle(document.documentElement, 'is-maximized', true)
        break
      case 'unmaximize':
        toggle(document.documentElement, 'is-maximized', false)
        break
      case 'init':
        toggle(document.documentElement, 'init', true)
        break
      case 'busy':
        toggle(document.documentElement, 'busy', ...args)
        break
      case 'ready':
        toggle(document.documentElement, 'ready', true)
        break
      case 'disable':
      case 'unload':
        toggle(document.documentElement, 'inactive', true)
        break
      case 'enable':
        toggle(document.documentElement, 'inactive', false)
        break
      case 'enter-full-screen':
        toggle(document.documentElement, 'is-full-screen', true)
        break
      case 'leave-full-screen':
        toggle(document.documentElement, 'is-full-screen', false)
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
