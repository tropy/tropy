'use strict'

const res = require('../common/res')
const { basename } = require('path')
const { warn, verbose } = require('../common/log')
const { transduce, map, transformer } = require('transducers.js')
const electron = require('electron')

class Menu {
  constructor(app) {
    this.app = app
  }

  find(ids, menu = this.menu) {
    const [id, ...tail] = ids
    const item = menu.items.find(x => x.id === id)

    if (!tail.length) return item
    if (!item.submenu) return undefined

    return this.find(tail, item.submenu)
  }

  responder(command, ...params) {
    let [prefix, ...action] = command.split(':')

    switch (prefix) {
      case 'app':
        return (_, win) => this.app.emit(command, win, ...params)
      case 'win':
        return (_, win) => win.webContents.send(...action)
      case 'dispatch':
        return (_, win) => win.webContents.send('dispatch', {
          type: action.join(':'), payload: params
        })
      default:
        warn(`no responder for menu command ${command}`)
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

        case 'dev':
          item.visible = (this.app.dev || ARGS.debug)
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
          item.enabled = this.app.history.past > 0
          break

        case 'redo':
          item.enabled = this.app.history.future > 0
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
        item.submenu = this.translate(item.submenu)
      }

      return item
    })
  }
}

class AppMenu extends Menu {
  async load(name = 'app') {
    this.template = (await res.Menu.open(name)).template
    return this.reload()
  }

  reload() {
    this.menu = this.build(this.template)
    return this.update()
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

  async load(name = 'context') {
    return (this.template = (await res.Menu.open(name)).template), this
  }

  prepare(template, settings) {
    if (this.app.dev) {
      settings = [...settings, 'dev']
    }

    return transduce(
      settings, map(key => template[key]), separate, []
    ).slice(1)
  }

  show({ scope, event }, win = this.app.win, ...args) {
    try {
      this.build(
        this.prepare(this.template, ContextMenu.scopes[scope]),
        event
      ).popup(win, ...args)

    } catch (error) {
      warn(`failed to show context-menu: ${error.message}`)
      verbose(error.stack)
    }
  }
}

{
  const { scopes } = ContextMenu

  scopes.sidebar = [...scopes.global, 'sidebar']
  scopes.project = [...scopes.sidebar, 'project']
  scopes.lists = [...scopes.sidebar, 'lists']
  scopes.list = [...scopes.lists, 'list']
  scopes.tags = [...scopes.sidebar, 'tags']
  scopes.tag = [...scopes.tags, 'tag']
  scopes.items = [...scopes.global, 'items']
  scopes.item = [...scopes.items, 'item']
  scopes.deleted = [...scopes.global, 'deleted']
  scopes.trash = [...scopes.sidebar, 'trash']
  scopes.photo = [...scopes.global, 'photo']
}

module.exports = {
  AppMenu,
  ContextMenu
}
