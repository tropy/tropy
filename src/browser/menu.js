'use strict'

const res = require('../common/res')
const { basename } = require('path')
const { warn, verbose } = require('../common/log')
const { get } = require('../common/util')
const { transduce, map, transformer } = require('transducers.js')
const { BrowserWindow, Menu: M } = require('electron')

function withWindow(win, cmd, fn) {
  return (_, w) => {
    if (!(win || w)) warn(`${cmd} called without window`)
    else fn(win || w)
  }
}

const CHECK = {
  hasMultiplePhotos(_, e) {
    return e && e.target && e.target.photos && e.target.photos.length > 1
  },

  hasMultipleItems(_, e) {
    return e && e.target && e.target.items && e.target.items.length > 1
  },

  hasSingleItem(...args) {
    return !CHECK.hasMultipleItems(...args)
  }
}

function check(item, event) {
  return (item.condition in CHECK) ?
    CHECK[item.condition](item, event) :
    event && event.target && !!event.target[item.condition]
}


class Menu {
  constructor(app) {
    this.app = app
  }

  async load(name) {
    const { defaultLocale, state } = this.app

    this.template = (
      await res.Menu.openWithFallback(defaultLocale, state.locale, name)
    ).template

    return this
  }

  find(ids, menu = this.menu) {
    const [id, ...tail] = ids
    const item = menu.items.find(x => x.id === id)

    if (!tail.length) return item
    if (!item.submenu) return undefined

    return this.find(tail, item.submenu)
  }

  responder(cmd, win, ...params) {
    let [prefix, action] = cmd.split(':', 2)

    switch (prefix) {
      case 'app':
        return (_, w) => this.app.emit(cmd, win || w, ...params)
      case 'ctx':
        return withWindow(win, cmd, w =>
          w.webContents.send('ctx', action, ...params))
      case 'win':
        return withWindow(win, cmd, w => w.webContents.send(action, params))
      case 'dispatch':
        return withWindow(win, cmd, w => w.webContents.send('dispatch', {
          type: action, payload: params
        }))
      default:
        warn(`no responder for menu command ${cmd}`)
    }
  }

  build(...args) {
    return M.buildFromTemplate(
      this.translate(...args)
        // Hiding of root items does not work at the moment.
        // See Electron #2895
        .filter(item => item.visible !== false)
    )
  }

  translate(template, win = BrowserWindow.getFocusedWindow(), event = {}) {
    // eslint-disable-next-line complexity
    return template.map(item => {
      item = { ...item }

      if (item.command) {
        item.click = this.responder(item.command, win, event)
      }

      if (item.label) {
        item.label = item.label
          .replace(/%(\w+)/g, (_, prop) => this.app[prop])
      }

      if (item.color) {
        let [color, context, command] = item.color

        item.type = 'checkbox'
        item.checked = get(event.target, context) === color

        if (color && color !== 'random')
          item.icon = res.Icons.color(color)
        if (command)
          item.click = this.responder(command, win, event, color)
      }

      if (item.condition) {
        item.enabled = check(item, event)
        if (item.visible === false) item.visible = item.enabled
      }

      switch (item.id) {
        // Electron does not support removing menu items
        // dynamically (#527), therefore we currently populate
        // recent projects only in the translation loop.
        case 'recent':
          if (item.id === 'recent') {
            if (this.app.state.recent.length) {
              item.enabled =  true

              item.submenu = [
                ...this.app.state.recent.map((file, idx) => ({
                  label: `${idx + 1}. ${basename(file)}`,
                  click: () => this.app.open(file)
                })),
                ...item.submenu
              ]
            }
          }
          break

        case 'updater-check':
          item.enabled = this.app.updater.isSupported
          item.visible = this.app.updater.canCheck
          break
        case 'updater-is-checking':
          item.visible = this.app.updater.isChecking
          break
        case 'updater-install':
          item.enabled = this.app.updater.isSupported
          item.visible = this.app.updater.isUpdateReady
          break

        case 'dev':
          item.visible = (this.app.dev || this.app.debug)
          break

        case 'theme':
          item.submenu = item.submenu.map(theme => ({
            ...theme,
            checked: (theme.id === this.app.state.theme),
            enabled: (theme.id !== this.app.state.theme),
            click: this.responder('app:switch-theme', win, theme.id)
          }))
          break

        case 'undo':
          if (this.app.getHistory(win).past > 0) {
            item.enabled = true
            // item.label = `${item.label} ${this.app.getHistory(win).undo}`
          } else {
            item.enabled = false
          }
          break

        case 'redo':
          if (this.app.getHistory(win).future > 0) {
            item.enabled = true
            // item.label = `${item.label} ${this.app.getHistory(win).redo}`
          } else {
            item.enabled = false
          }
          break

        case 'export': {
          let plugins = this.app.plugins.available('export')
          if (plugins.length > 0) {
            item.submenu = [
              ...item.submenu,
              { type: 'separator' },
              ...plugins.map(({ id, name }) => ({
                label: name,
                click: this.responder('app:export-item', win, {
                  target: event.target,
                  plugin: id
                })
              }))
            ]
          }
          break
        }

        case 'tag': {
          let { target } = event
          let tags = this.app.getTags(win)

          if (!tags.length) {
            item.enabled = false

          } else {
            item.submenu = [
              ...item.submenu,
              ...tags.map(tag => ({
                type: 'checkbox',
                label: tag.name,
                checked: target.tags.includes(tag.id),
                click: this.responder('app:toggle-item-tag', win, {
                  id: target.id,
                  tag: tag.id
                })
              }))
            ]

            if (target.tags.length) {
              item.submenu[0] = {
                ...item.submenu[0],
                checked: false,
                enabled: true,
                click: this.responder('app:clear-item-tags', win, {
                  id: target.id
                })
              }
            }
          }

          break
        }
        case 'line-wrap':
          item.checked = !!event.target.wrap
          break

        case 'line-numbers':
          item.checked = !!event.target.numbers
          break

        case 'writing-mode':
          item.submenu = item.submenu.map(li => ({
            ...li,
            checked: li.mode === event.target.mode,
            click: this.responder('app:writing-mode', win, {
              id: event.target.id, mode: li.mode
            })
          }))
          break

        case 'item-view-layout':
          item.submenu = item.submenu.map(li => ({
            ...li,
            checked: li.id === event.target.layout,
            click: this.responder('app:settings-persist', win, {
              layout: li.id
            })
          }))
          break
      }

      if (item.submenu) {
        item.submenu = this.translate(item.submenu, win, event)
      }

      return item
    })
  }
}

class AppMenu extends Menu {
  async load(name = 'app') {
    try {
      return (await super.load(name))
    } catch (error) {
      throw error
    } finally {
      this.reload()
    }
  }

  reload() {
    const old = this.menu

    if (this.template != null) {
      this.menu = this.build(this.template)
      this.update()
    }

    if (old != null) {
      old.destroy()
    }

    return this
  }

  update() {
    return M.setApplicationMenu(this.menu), this
  }
}

const separate = transformer(
  (menu, items) => ([...menu, { type: 'separator' }, ...items]),
)

class ContextMenu extends Menu {
  static scopes = {
    global: ['history']
  }

  load(name = 'context') {
    return super.load(name)
  }

  prepare(template, settings) {
    if (this.app.dev || this.app.debug) {
      settings = [...settings, 'dev']
    }

    return transduce(
      settings, map(key => template[key]), separate, []
    ).slice(1)
  }

  show({ scope, event }, window) {
    return new Promise((resolve, reject) =>  {
      try {
        this.build(
          this.prepare(this.template, ContextMenu.scopes[scope]),
          window,
          event
        ).popup({ window, callback: resolve })

      } catch (error) {
        warn(`failed to show context-menu: ${error.message}`, {
          scope,
          stack: error.stack
        })
        reject(error)
      }
    })
  }
}

{
  const { scopes } = ContextMenu

  scopes.sidebar = [...scopes.global, 'project', 'lists', 'tags']
  scopes.lists = [...scopes.sidebar]
  scopes.list = [...scopes.global, 'project', 'lists', 'list', 'tags']
  scopes.tags = [...scopes.sidebar]
  scopes.tag = [...scopes.sidebar, 'tag']
  scopes.items = [...scopes.global, 'items']
  scopes.item = [...scopes.items, 'item']
  scopes.trash = [...scopes.sidebar, 'trash']
  scopes.photo = [...scopes.global, 'photo']
  scopes.selection = [...scopes.photo, 'selection']
  scopes.note = [...scopes.global, 'note']
  scopes['metadata-list'] = [...scopes.global, 'metadata-list']
  scopes['metadata-field'] = [...scopes['metadata-list'], 'metadata-field']
  scopes['item-bulk'] = [...scopes.items, 'item-bulk']
  scopes['item-list'] = [...scopes.items, 'item-list', 'item']
  scopes['item-bulk-list'] = [...scopes.items, 'item-bulk-list', 'item-bulk']
  scopes['item-deleted'] = [...scopes.global, 'item-deleted']
  scopes['item-bulk-deleted'] = [...scopes.global, 'item-bulk-deleted']
  scopes['item-tag'] = [...scopes.global, 'item-tag']
  scopes['item-view'] = [...scopes.global, 'item-view']
  scopes.notepad = [...scopes['item-view'], 'notepad']
  scopes.esper = [...scopes['item-view']]
}

module.exports = {
  AppMenu,
  ContextMenu
}
