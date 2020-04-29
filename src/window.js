'use strict'

const { ipcRenderer: ipc } = require('electron')
const { basename, join } = require('path')
const { existsSync: exists } = require('fs')
const { EL_CAPITAN, darwin } = require('./common/os')
const { Plugins } = require('./common/plugins')
const { delay, pick } = require('./common/util')
const { EventEmitter } = require('events')
const args = require('./args')
const debounce = require('lodash.debounce')

const {
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
} = require('./dom')

const isCommand = darwin ?
  e => e.metaKey && !e.altKey && !e.ctrlKey :
  e => e.ctrlKey && !e.altKey && !e.metaKey

const STYLES = join(__dirname, '..', 'lib', 'stylesheets', process.platform)

class Window extends EventEmitter {
  constructor(opts) {
    if (Window.instance) {
      throw Error('Singleton Window constructor called multiple times')
    }

    super()
    Window.instance = this

    this.type = basename(location.pathname, '.html')

    this.state = pick(opts, [
      'aqua',
      'data',
      'fontSize',
      'frameless',
      'scrollbars',
      'theme',
      'dark',
      'constrast',
      'maximizable',
      'minimizable'
    ])

    this.plugins = new Plugins(opts.plugins)
    this.unloader = 'close'
    this.unloaders = []
    this.hasFinishedUnloading = false
  }

  init() {
    return Promise.all([
      this.plugins.reload().then(p => p.create().emit('change')),

      new Promise((resolve) => {
        this.unloaders.push(this.plugins.flush)

        this.handleUnload()
        this.handleTabFocus()
        this.handleIpcEvents()
        this.handleEditorCommands()
        this.handleModifierKeys()
        this.handleMouseButtons()
        this.handleUncaughtExceptions()

        toggle(document.body, process.platform, true)

        let { aqua, frameless } = this.state

        if (aqua)
          toggle(document.body, aqua, true)

        this.setScrollBarStyle()
        this.setFontSize()

        if (frameless) {
          toggle(document.body, 'frameless', true)

          if (EL_CAPITAN)
            toggle(document.body, 'el-capitan', true)
          else
            this.createWindowControls()
        }

        resolve()
      }),

      this.style(false)
    ])
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

  get theme() {
    return (this.state.theme !== 'system') ?
      this.state.theme :
      (this.state.dark ? 'dark' : 'light')
  }

  get stylesheets() {
    let { theme } = this
    return [
      join(STYLES, `window-${theme}.css`),
      join(STYLES, `${this.type}-${theme}.css`),
      join(this.state.data, 'style.css'),
      join(this.state.data, `style-${theme}.css`)
    ]
  }

  setFontSize(fontSize = this.state.fontSize) {
    this.state.fontSize = fontSize

    if (this.type !== 'print') {
      document.documentElement.style.fontSize = fontSize
    }
  }

  setScrollBarStyle(scrollbars = this.state.scrollbars) {
    this.state.scrollbars = scrollbars
    toggle(document.body, 'scrollbar-style-old-school', scrollbars)
  }

  handleIpcEvents() {
    ipc
      .on('win', (_, state) => {
        this.toggle(state)
        this.emit(state)
      })
      .on('theme', (_, theme, { dark, contrast } = {}) => {
        args.update({ theme, dark, contrast })
        Object.assign(this.state, { theme, dark, contrast })
        this.style(true)
      })
      .on('fontSize', (_, fontSize) => {
        args.update({ fontSize })
        this.setFontSize(fontSize)
        this.emit('settings.update', { fontSize })
      })
      .on('recent', (_, recent) => {
        args.update({ recent })
      })
      .on('locale', (_, locale) => {
        args.update({ locale })
        this.emit('settings.update', { locale })
      })
      .on('debug', (_, debug) => {
        args.update({ debug })
        this.emit('settings.update', { debug })
      })
      .on('scrollbars', (_, scrollbars) => {
        this.setScrollBarStyle(scrollbars)
        this.style(true)
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
        this.plugins.create()
        this.plugins.emit('change')
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
      toggle(document.body, 'alt-key', event.altKey)
      toggle(document.body, 'meta-key', event.metaKey)
      toggle(document.body, 'ctrl-key', event.ctrlKey)
    }, { passive: true, capture: true })

    on(document, 'keyup', up, { passive: true, capture: true })
    on(window, 'blur', up, { passive: true })

    function up(event) {
      toggle(document.body, 'alt-key', event.altKey === true)
      toggle(document.body, 'meta-key', event.metaKey === true)
      toggle(document.body, 'ctrl-key', event.ctrlKey === true)
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
  }

  createWindowControls() {
    this.controls = {
      close: create('button', { tabindex: '-1', class: 'close' }),
      min: create('button', { tabindex: '-1', class: 'minimize' }),
      max: create('button', { tabindex: '-1', class: 'maximize' })
    }

    on(this.controls.close, 'click', this.close)

    if (this.state.minimizable)
      on(this.controls.min, 'click', this.minimize)
    else
      toggle(document.body, 'not-minimizable', true)

    if (this.state.maximizable)
      on(this.controls.max, 'click', this.maximize)
    else
      toggle(document.body, 'not-maximizable', true)

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

    this.emit('settings.update', { theme: this.state.theme })

    await Promise.race([
      Promise.all(loaded),
      delay(250)
    ])
  }

  toggle(state) {
    switch (state) {
      case 'focus':
        toggle(document.body, 'is-blurred', false)
        break
      case 'blur':
        toggle(document.body, 'is-blurred', true)
        break
      case 'maximize':
        toggle(document.body, 'is-maximized', true)
        break
      case 'unmaximize':
        toggle(document.body, 'is-maximized', false)
        break
      case 'init':
        toggle(document.body, 'init', true)
        break
      case 'ready':
        toggle(document.body, 'ready', true)
        break
      case 'disable':
      case 'unload':
        toggle(document.body, 'inactive', true)
        break
      case 'enable':
        toggle(document.body, 'inactive', false)
        break
      case 'enter-full-screen':
        toggle(document.body, 'is-full-screen', true)
        break
      case 'leave-full-screen':
        toggle(document.body, 'is-full-screen', false)
        break
    }
  }

  maximize() {
    this.send('maximize')
  }

  minimize() {
    this.send('minimize')
  }

  preview(file) {
    this.send('preview', file)
  }

  send(type, ...params) {
    ipc.send('wm', type, ...params)
  }
}

module.exports = {
  Window,

  get win() { return Window.instance || new Window(ARGS) }
}
