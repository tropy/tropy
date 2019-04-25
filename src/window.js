'use strict'

const { each } = require('bluebird')
const { ipcRenderer: ipc } = require('electron')
const { basename, join } = require('path')
const { existsSync: exists } = require('fs')
const { EL_CAPITAN, darwin } = require('./common/os')
const { Plugins } = require('./common/plugins')
const { addIdleObserver } = require('./common/idle')
const { pick } = require('./common/util')
const { EventEmitter } = require('events')
const args = require('./args')

const {
  $$, append, emit, create, isInput, on, off, toggle, stylesheet, remove
} = require('./dom')

const isCommand = darwin ?
  e => e.metaKey && !e.altKey && !e.ctrlKey :
  e => e.ctrlKey && !e.altKey && !e.metaKey

const IDLE_SHORT = 60

class Window extends EventEmitter {
  constructor(opts = ARGS) {
    if (Window.instance) {
      throw Error('Singleton Window constructor called multiple times')
    }

    super()
    Window.instance = this

    this.state = pick(opts, [
      'aqua',
      'frameless',
      'scrollbars',
      'theme',
      'dark',
      'maximizable',
      'minimizable'
    ])

    this.pointer = {}
    this.plugins = new Plugins(ARGS.plugins)
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
        this.handleMouseEnter()
        this.handleMouseButtons()

        addIdleObserver(this.handleIdleEvents, IDLE_SHORT)

        toggle(document.body, process.platform, true)

        let { aqua, frameless } = this.state

        if (aqua)
          toggle(document.body, aqua, true)

        this.setScrollBarStyle()

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
    ipc.send('wm', 'close')
  }

  destroy() {
    ipc.send('wm', 'destroy')
  }

  undo() {
    ipc.send('wm', 'undo')
  }

  redo() {
    ipc.send('wm', 'redo')
  }

  get type() {
    return basename(window.location.pathname, '.html')
  }

  get theme() {
    return (this.state.theme !== 'system') ?
      this.state.theme :
      (this.state.dark ? 'dark' : 'light')
  }

  get stylesheets() {
    let { theme } = this
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
      .on('theme', (_, theme, dark) => {
        args.update({ theme, dark })
        this.state.theme = theme
        this.state.dark = dark
        this.style(true)
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
      .on('ctx', (_, action, detail) => {
        // NB: delay event for pointer position to be up-to-date!
        setTimeout(() => {
          emit(document, `ctx:${action}`, {
            detail: { ...detail, ...this.pointer }
          })
        }, 25)
      })
      .on('global', (_, action) => {
        emit(document, `global:${action}`)
      })
  }

  handleIdleEvents = (_, type, time) => {
    this.emit('idle', { type, time })
  }

  handleUnload() {
    on(window, 'beforeunload', event => {
      if (this.hasFinishedUnloading) return

      event.returnValue = false

      if (this.isUnloading) return

      this.isUnloading = true

      toggle(document.body, 'quitting', true)

      each(this.unloaders, unload => unload())
        .finally(() => {
          this.hasFinishedUnloading = true
          ipc.send('wm', this.unloader)
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
            if (isInput(event.target)) this.redo()
            else this.emit('app.redo')
          } else {
            if (isInput(event.target)) this.undo()
            else this.emit('app.undo')
          }
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

  handleMouseEnter() {
    on(document, 'mouseenter', event => {
      this.pointer.x = event.clientX
      this.pointer.y = event.clientY
    }, { passive: true, capture: false })
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
    ipc.send('wm', 'reload')
  }

  style(prune = false) {
    return new Promise((resolve, reject) => {
      if (prune) {
        for (let css of $$('head > link[rel="stylesheet"]'))
          remove(css)
      }

      let count = document.styleSheets.length

      for (let css of this.stylesheets) {
        if (exists(join(__dirname, css))) {
          ++count
          append(stylesheet(css), document.head)
        }
      }

      this.emit('settings.update', { theme: this.state.theme })

      let limit = Date.now() + 250
      let ti = setInterval(() => {
        try {
          if (document.styleSheets.length === count || Date.now() > limit) {
            clearInterval(ti)
            resolve()
          }
        } catch (error) {
          reject(error)
        }
      }, 15)
    })
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
    ipc.send('wm', 'maximize')
  }

  minimize() {
    ipc.send('wm', 'minimize')
  }
}

module.exports = {
  Window,

  get win() { return Window.instance || new Window() }
}
