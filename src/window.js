'use strict'

const { remote } = require('electron')
const { basename } = require('path')
const { append, create, on, toggle, stylesheet } = require('./dom')
const { EL_CAPITAN } = require('./common/os')

const Window = {

  get current() {
    return remote.BrowserWindow.getFocusedWindow()
  },

  get type() {
    return basename(window.location.pathname, '.html')
  },

  get styles() {
    return [
      `../lib/stylesheets/${process.platform}/${Window.type}.css`
    ]
  },

  setup() {
    if (!Window.setup.called) {
      Window.setup.called = true


      for (let css of Window.styles) {
        append(stylesheet(css), document.head)
      }


      if (global.args.frameless) {
        toggle(document.body, 'frameless', true)

        if (EL_CAPITAN) {
          toggle(document.body, 'hidden-inset', true)

        } else {
          Window.controls = {
            close: create('button', { tabindex: '-1', class: 'close' }),
            min: create('button', { tabindex: '-1', class: 'minimize' }),
            max: create('button', { tabindex: '-1', class: 'maximize' })
          }

          on(Window.controls.close, 'click', () =>
              Window.current.close())

          on(Window.controls.min, 'click', () =>
              Window.current.minimize())

          on(Window.controls.max, 'click', () =>
              Window.current.isMaximized() ?
                Window.current.unmaximize() : Window.current.maximize())

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

module.exports = Window
