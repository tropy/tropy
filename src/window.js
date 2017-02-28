'use strict'

const { each } = require('bluebird')
const { remote, ipcRenderer: ipc } = require('electron')
const { basename, resolve } = require('path')
const { existsSync: exists } = require('fs')
const { debug } = require('./common/log')
const { EL_CAPITAN } = require('./common/os')

const {
  $$, append, emit, create, on, once, toggle, stylesheet, remove
} = require('./dom')


class Window {
  constructor(options = ARGS) {
    if (Window.instance) {
      throw Error('Singleton Window constructor called multiple times')
    }

    Window.instance = this

    this.options = options

    this.theme = options.theme

    this.unloaders = []
    this.hasFinishedUnloading = false
  }

  init() {
    this.style()

    this.handleUnload()
    this.handleTabFocus()
    this.handleIpcEvents()

    const { aqua, frameless, scrollbars } = this.options

    if (aqua) {
      toggle(document.body, aqua, true)
    }

    toggle(document.body, 'scrollbar-style-old-school', scrollbars)

    if (frameless) {
      toggle(document.body, 'frameless', true)

      if (EL_CAPITAN) {
        toggle(document.body, 'el-capitan', true)

      } else {
        this.createWindowControls()
      }
    }
  }

  get current() {
    return remote.getCurrentWindow()
  }

  get type() {
    return basename(window.location.pathname, '.html')
  }

  get stylesheets() {
    return [
      `../lib/stylesheets/${process.platform}/${this.type}-${this.theme}.css`,
      `${this.options.home}/style.css`,
      `${this.options.home}/style-${this.theme}.css`
    ]
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
        toggle(document.body, 'scrollbar-style-old-school', scrollbars)
      })
      .on('refresh', () => {
        this.style(false, true)
      })
  }

  handleUnload() {
    let unloader = 'close'

    ipc.on('reload', () => {
      unloader = 'reload'
      this.current.reload()
    })

    once(window, 'beforeunload', event => {
      debug(`unloading ${this.type}...`)

      event.returnValue = false
      toggle(document.body, 'closing', true)

      each(this.unloaders, unload => {
        let res = unload()
        return res
      })
        .tap(res => {
          debug(res.length)
          debug('unloader finished', res)
        })
        .finally(() => {
          debug(`ready to close ${this.type}`)

          this.hasFinishedUnloading = true
          setTimeout(() => this.current[unloader](), 15)
        })
    })

    on(window, 'beforeunload', event => {
      if (!this.hasFinishedUnloading) event.returnValue = false
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

  style(theme, prune = false) {
    if (theme) this.theme = theme

    if (prune) {
      for (let css of $$('head > link[rel="stylesheet"]')) remove(css)
    }

    for (let css of this.stylesheets) {
      if (exists(resolve(__dirname, css))) {
        append(stylesheet(css), document.head)
      }
    }
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
