'use strict'

const { each } = require('bluebird')
const { remote, ipcRenderer: ipc } = require('electron')
const { basename, resolve } = require('path')
const { existsSync: exists } = require('fs')
const { debug } = require('./common/log')
const { EL_CAPITAN } = require('./common/os')

const {
  $$, append, create, on, once, toggle, stylesheet, remove
} = require('./dom')

const Window = {

  get current() {
    return remote.getCurrentWindow()
  },

  get type() {
    return basename(window.location.pathname, '.html')
  },

  styles() {
    debug(`applying ${Window.type} ${Window.theme} styles`)

    return [
      `../lib/stylesheets/${process.platform}/${Window.type}-${Window.theme}.css`,
      `${ARGS.home}/style.css`,
      `${ARGS.home}/style-${Window.theme}.css`
    ]
  },

  style(theme, prune = false) {
    var css

    if (theme) Window.theme = theme

    if (prune) {
      for (css of $$('head > link[rel="stylesheet"]')) remove(css)
    }

    for (css of Window.styles()) {
      if (exists(resolve(__dirname, css))) {
        append(stylesheet(css), document.head)
      }
    }
  },

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
  },

  setup() {
    if (!Window.setup.called) {
      Window.setup.called = true
      Window.style(ARGS.theme)

      ipc
        .on('win', (_, state) => this.toggle(state))
        .on('theme', (_, theme) => this.style(theme, true))
        .on('refresh', () => this.style(false, true))
        .on('reload', () => {
          unloader = 'reload'
          Window.current.reload()
        })


      Window.unloaded = false
      let unloader = 'close'

      once(window, 'beforeunload', event => {
        debug(`unloading ${Window.type}...`)

        event.returnValue = false
        toggle(document.body, 'closing', true)

        each(Window.unloaders, unload => unload())
          .finally(() => {
            debug(`ready to close ${Window.type}`)

            Window.unloaded = true
            setTimeout(() => Window.current[unloader](), 15)
          })
      })

      on(window, 'beforeunload', event => {
        if (!Window.unloaded) event.returnValue = false
      })


      if (ARGS.frameless) {
        toggle(document.body, 'frameless', true)

        if (EL_CAPITAN) {
          toggle(document.body, 'el-capitan', true)

        } else {
          Window.controls = {
            close: create('button', { tabindex: '-1', class: 'close' }),
            min: create('button', { tabindex: '-1', class: 'minimize' }),
            max: create('button', { tabindex: '-1', class: 'maximize' })
          }

          on(Window.controls.close, 'click', () =>
              Window.current.close())

          if (Window.current.isMinimizable()) {
            on(Window.controls.min, 'click', () =>
                Window.current.minimize())

          } else {
            toggle(document.body, 'not-minimizable', true)
          }

          if (Window.current.isMaximizable()) {
            on(Window.controls.max, 'click', () =>
                Window.current.isMaximized() ?
                  Window.current.unmaximize() : Window.current.maximize())

          } else {
            toggle(document.body, 'not-maximizable', true)
          }

          const div = create('div', { class: 'window-controls' })

          append(Window.controls.close, div)
          append(Window.controls.min, div)
          append(Window.controls.max, div)

          append(div, document.body)
        }
      }
    }
  }
}

Window.unloaders = []

module.exports = Window
