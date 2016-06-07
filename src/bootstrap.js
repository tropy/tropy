'use strict'

global.START_TIME = Date.now()
global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}

{
  const decode = decodeURIComponent
  const hash = window.location.hash.slice(1)

  if (process.env.NODE_ENV !== 'test') {
    global.args = Object.freeze(JSON.parse(decode(hash)))

    process.env.NODE_ENV = global.args.environment
    process.env.DEBUG = global.args.debug

  } else {
    global.args = {
      environment: 'test',
      debug: process.env.DEBUG
    }
  }
}


const { verbose } = require('./common/log')(global.args.home)
const { remote } = require('electron')
const { basename } = require('path')
const { release } = require('os')
const { ready, append, stylesheet, create, on, toggle } = require('./dom')

const PAGE = basename(window.location.pathname, '.html')

ready(() => {
  verbose('%s ready after %dms', PAGE, Date.now() - global.START_TIME)

  append(
    stylesheet(`../lib/stylesheets/${process.platform}/${PAGE}.css`),
    document.head)

  if (global.args.frameless) {
    const controls = create('div', { class: 'window-controls' })

    const close = create('button', { tabindex: '-1', class: 'close' })
    const min = create('button', { tabindex: '-1', class: 'minimize' })
    const max = create('button', { tabindex: '-1', class: 'maximize' })

    const win = (action) => {
      return () => remote.BrowserWindow.getFocusedWindow()[action]()
    }

    on(close, 'click', win('close'))
    append(close, controls)

    on(min, 'click', win('minimize'))
    append(min, controls)

    on(max, 'click', win('maximize'))
    append(max, controls)

    append(controls, document.body)

    toggle(document.body, 'frameless', true)
  }

  if (process.platform === 'darwin' && release() > '15') {
    toggle(document.body, 'hidden-inset', true)
  }
})


if (global.args.environment === 'development') {
  if (process.platform !== 'linux') {
    const props = Object.defineProperties

    props(process, {
      stdout: { value: remote.process.stdout },
      stderr: { value: remote.process.stderr }
    })
  }

  // try {
  //   require('devtron').install()
  // } catch (_) {
  //   // ignore
  // }
}
