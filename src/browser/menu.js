'use strict'

const res = require('../common/res')
const { basename } = require('path')
const { warn, verbose } = require('../common/log')
const { transduce, map, transformer } = require('transducers.js')
const electron = require('electron')

function withWindow(cmd, fn) {
  return (_, win) => {
    if (!win) warn(`${cmd} called without window`)
    else fn(win)
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
  return CHECK[item.condition] && CHECK[item.condition](item, event)
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

  responder(cmd, ...params) {
    let [prefix, ...action] = cmd.split(':')

    switch (prefix) {
      case 'app':
        return (_, win) => this.app.emit(cmd, win, ...params)
      case 'win':
        return withWindow(cmd, win => win.webContents.send(...action))
      case 'dispatch':
        return withWindow(cmd, win => win.webContents.send('dispatch', {
          type: action.join(':'), payload: params
        }))
      default:
        warn(`no responder for menu command ${cmd}`)
    }
  }

  build(...args) {
    return electron.Menu.buildFromTemplate(
      this.translate(...args)
        // Hiding of root items does not work at the moment.
        // See Electron #2895
        .filter(item => item.visible !== false)
    )
  }

  translate(template, ...params) {
    // eslint-disable-next-line complexity
    return template.map(item => {
      item = { ...item }

      if (item.command) {
        item.click = this.responder(item.command, ...params)
      }

      if (item.label) {
        item.label = item.label
          .replace(/%(\w+)/g, (_, prop) => this.app[prop])
      }

      if (item.condition) {
        item.enabled = check(item, ...params)
        if (item.visible === false) item.visible = item.enabled
      }

      if ('color' in item) {
        const { target } = params[0]

        if (item.color != null) {
          item.icon = res.Icons.color(item.color)
        }

        item.checked = target.color === item.color
        item.click = this.responder('app:save-tag', {
          id: target.id,
          color: item.color
        })
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
            click: this.responder('app:switch-theme', theme.id)
          }))
          break

        case 'undo':
          if (this.app.history.past > 0) {
            item.enabled = true
            // item.label = `${item.label} ${this.app.history.undo}`
          } else {
            item.enabled = false
          }
          break

        case 'redo':
          if (this.app.history.future > 0) {
            item.enabled = true
            // item.label = `${item.label} ${this.app.history.redo}`
          } else {
            item.enabled = false
          }
          break

        case 'tag': {
          const { target } = params[0]

          if (!this.app.tags.length) {
            item.enabled = false

          } else {
            item.submenu = [
              ...item.submenu,
              ...this.app.tags.map(tag => ({
                type: 'checkbox',
                label: tag.name,
                checked: target.tags.includes(tag.id),
                click: this.responder('app:toggle-item-tag', {
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
                click: this.responder('app:clear-item-tags', {
                  id: target.id
                })
              }
            }
          }

          break
        }
      }

      if (item.submenu) {
        item.submenu = this.translate(item.submenu, ...params)
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
    return electron.Menu.setApplicationMenu(this.menu), this
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

  show({ scope, event }, win = this.app.win, options) {
    try {
      this.build(
        this.prepare(this.template, ContextMenu.scopes[scope]),
        event
      ).popup(win, { ...options, async: true })

    } catch (error) {
      warn(`failed to show context-menu: ${error.message}`)
      verbose(error.stack)
    }
  }
}

{
  const { scopes } = ContextMenu

  scopes.sidebar = [...scopes.global, 'sidebar', 'lists', 'tags']
  scopes.project = [...scopes.sidebar, 'project']
  scopes.lists = [...scopes.sidebar, 'lists']
  scopes.list = [...scopes.sidebar, 'list']
  scopes.tags = [...scopes.sidebar, 'tags']
  scopes.tag = [...scopes.sidebar, 'tag']
  scopes.items = [...scopes.global, 'items']
  scopes.item = [...scopes.items, 'item']
  scopes.trash = [...scopes.sidebar, 'trash']
  scopes.photo = [...scopes.global, 'photo']
  scopes.selection = [...scopes.photo, 'selection']
  scopes.notes = [...scopes.global]
  scopes.note = [...scopes.notes, 'note']
  scopes['item-bulk'] = [...scopes.items, 'item-bulk']
  scopes['item-list'] = [...scopes.items, 'item-list', 'item']
  scopes['item-bulk-list'] = [...scopes.items, 'item-bulk-list', 'item-bulk']
  scopes['item-deleted'] = [...scopes.global, 'item-deleted']
  scopes['item-bulk-deleted'] = [...scopes.global, 'item-bulk-deleted']
  scopes['item-tag'] = [...scopes.global, 'item-tag']
}

module.exports = {
  AppMenu,
  ContextMenu
}
