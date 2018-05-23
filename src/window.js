'use strict'

const { each } = require('bluebird')
const { remote, ipcRenderer: ipc } = require('electron')
const { basename, join, resolve } = require('path')
const { existsSync: exists } = require('fs')
const { EL_CAPITAN, darwin } = require('./common/os')
const { Plugins } = require('./common/plugins')
const { EventEmitter } = require('events')
const args = require('./args')

const {
  $$, append, emit, create, isInput, on, off, toggle, stylesheet, remove
} = require('./dom')

const isCommand = darwin ?
  e => e.metaKey && !e.altKey && !e.ctrlKey :
  e => e.ctrlKey && !e.altKey && !e.metaKey


class Window extends EventEmitter {
  constructor({ theme, frameless, scrollbars, aqua } = ARGS) {
    if (Window.instance) {
      throw Error('Singleton Window constructor called multiple times')
    }

    super()
    Window.instance = this

    this.state = {
      aqua, frameless, scrollbars, theme
    }

    this.plugins = new Plugins(ARGS.plugins)
    this.unloader = 'close'
    this.unloaders = []
    this.hasFinishedUnloading = false
  }

  init(done) {
    this.plugins.reload()
      .then(plugins => plugins.create().emit('change'))
    this.unloaders.push(this.plugins.flush)

    this.handleUnload()
    this.handleTabFocus()
    this.handleIpcEvents()
    this.handleEditorCommands()
    this.handleModifierKeys()

    toggle(document.body, process.platform, true)

    const { aqua, frameless } = this.state

    if (aqua) {
      toggle(document.body, aqua, true)
    }

    this.setScrollBarStyle()

    if (frameless) {
      toggle(document.body, 'frameless', true)

      if (EL_CAPITAN) {
        toggle(document.body, 'el-capitan', true)

      } else {
        this.createWindowControls()
      }
    }

    this.style(this.state.theme, false, done)
  }

  show = () => {
    const { current } = this
    current.show()
    current.focus()
  }

  undo() {
    this.current.webContents.undo()
  }

  redo() {
    this.current.webContents.redo()
  }

  get current() {
    return remote.getCurrentWindow()
  }

  get type() {
    return basename(window.location.pathname, '.html')
  }

  get stylesheets() {
    const { theme } = this.state

    return [
      `../lib/stylesheets/${process.platform}/${this.type}-${theme}.css`,
      join(ARGS.home, 'style.css'),
      join(ARGS.home, `style-${theme}.css`)
    ]
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
      .on('theme', (_, theme) => {
        this.style(theme, true)
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
        this.style(false, true)
      })
      .on('refresh', () => {
        this.style(false, true)
      })
      .on('reload', () => {
        this.reload()
      })
      .on('plugins-reload', async () => {
        this.plugins.clearModuleCache()
        await this.plugins.reload()
        this.plugins.create()
        this.plugins.emit('change')
      })
      .on('toggle-perf-tools', () => {
        const { search, hash } = location
        const perf = '?react_perf'

        history.pushState('', '',
          `${(search === perf) ? '' : perf}${hash}`)

        this.reload()
      })
  }

  handleUnload() {
    on(window, 'beforeunload', event => {
      if (this.hasFinishedUnloading) return

      event.returnValue = false

      if (this.isUnloading) return

      this.isUnloading = true

      toggle(document.body, 'quitting', true)

      each(this.unloaders, unload => {
        let res = unload()
        return res
      })
        .finally(() => {
          this.hasFinishedUnloading = true

          // Calling reload/close immediately does not work reliably.
          // See Electron #7977
          setTimeout(() => this.current[this.unloader](), 25)
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
          if (isInput(event.target)) this.undo()
          else this.emit('app.undo')
          break

        case 'Z':
        case 'y':
          if (isInput(event.target)) this.redo()
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

  createWindowControls() {
    this.controls = {
      close: create('button', { tabindex: '-1', class: 'close' }),
      min: create('button', { tabindex: '-1', class: 'minimize' }),
      max: create('button', { tabindex: '-1', class: 'maximize' })
    }

    on(this.controls.close, 'click', () =>
      this.current.close())

    if (this.current.isMinimizable()) {
      on(this.controls.min, 'click', () => this.minimize())

    } else {
      toggle(document.body, 'not-minimizable', true)
    }

    if (this.current.isMaximizable()) {
      on(this.controls.max, 'click', () => this.maximize())

    } else {
      toggle(document.body, 'not-maximizable', true)
    }

    const div = create('div', { class: 'window-controls' })

    append(this.controls.close, div)
    append(this.controls.min, div)
    append(this.controls.max, div)

    append(div, document.body)
  }

  reload() {
    this.unloader = 'reload'
    this.current.reload()
  }

  style(theme, prune = false, done) {
    if (theme) {
      this.state.theme = theme
      args.update({ theme })
    }

    if (prune) {
      for (let css of $$('head > link[rel="stylesheet"]')) remove(css)
    }

    let count = document.styleSheets.length

    for (let css of this.stylesheets) {
      if (exists(resolve(__dirname, css))) {
        ++count
        append(stylesheet(css), document.head)
      }
    }

    this.emit('settings.update', { theme: this.state.theme })

    if (done == null) return

    let limit = Date.now() + 500
    let ti = setInterval(() => {
      if (document.styleSheets.length === count || Date.now() > limit) {
        clearInterval(ti)
        done()
      }
    }, 15)

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
      case 'enter-full-screen':
        toggle(document.body, 'is-full-screen', true)
        break
      case 'leave-full-screen':
        toggle(document.body, 'is-full-screen', false)
        break
    }
  }

  maximize = () => {
    this.current.isMaximized() ?
      this.current.unmaximize() : this.current.maximize()
  }

  minimize() {
    this.current.minimize()
  }
}

module.exports = {
  Window,

  get win() { return Window.instance || new Window() }
}
