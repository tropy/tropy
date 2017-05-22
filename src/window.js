'use strict'

const { each } = require('bluebird')
const { remote, ipcRenderer: ipc } = require('electron')
const { basename, join, resolve } = require('path')
const { existsSync: exists } = require('fs')
const { debug } = require('./common/log')
const { EL_CAPITAN } = require('./common/os')

const {
  $$, append, emit, create, on, once, toggle, stylesheet, remove
} = require('./dom')


class Window {
  constructor({ theme, frameless, scrollbars, aqua } = ARGS) {
    if (Window.instance) {
      throw Error('Singleton Window constructor called multiple times')
    }

    Window.instance = this

    this.state = {
      aqua, frameless, scrollbars, theme
    }

    this.unloader = 'close'
    this.unloaders = []
    this.hasFinishedUnloading = false
  }

  init(done) {
    this.handleUnload()
    this.handleTabFocus()
    this.handleIpcEvents()

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

  show() {
    this.current.show()
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
      })
      .on('theme', (_, theme) => {
        this.style(theme, true)
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
  }

  handleUnload() {
    on(window, 'beforeunload', event => {
      if (this.hasFinishedUnloading) return

      event.returnValue = false

      if (this.isUnloading) return

      debug(`unloading ${this.type}...`)
      this.isUnloading = true

      toggle(document.body, 'closing', true)

      each(this.unloaders, unload => {
        let res = unload()
        return res
      })
        .finally(() => {
          debug(`ready to close ${this.type} (${this.unloader})`)

          this.hasFinishedUnloading = true

          // Calling reload/close immediately does not work reliably.
          // See Electron #7977
          setTimeout(() => this.current[this.unloader](), 25)
        })
    })
  }

  handleTabFocus() {
    on(document.body, 'keydown', event => {
      if (event.key === 'Tab' && !event.defaultPrevented) {
        // Set up timer here to detect tab 'gap'!
        once(document.body, 'focusin', ({ target }) => {
          if (target) emit(target, 'tab:focus')
        })
      }
    })
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
    if (theme) this.state.theme = theme

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

    if (done == null) return

    let limit = Date.now() + 2000
    let ti = setInterval(() => {
      if (document.styleSheets.length === count || Date.now() > limit) {
        clearInterval(ti)
        done()
      }
    }, 10)

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

  maximize() {
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
