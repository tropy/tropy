'use strict'

const res = require('../common/res')
const { basename } = require('path')
const { warn } = require('../common/log')
const { Menu } = require('electron')

module.exports = class AppMenu {
  constructor(app) {
    this.app = app
  }

  update() {
    return Menu.setApplicationMenu(this.menu), this
  }

  find(ids, menu = this.menu) {
    const [id, ...tail] = ids
    const item = menu.items.find(x => x.id === id)

    if (!tail.length) return item
    if (!item.submenu) return undefined

    return this.find(tail, item.submenu)
  }

  async load(name = 'app') {
    let template = (await res.Menu.open(name)).template
    this.menu = this.build(template)

    return this.update()
  }

  responder(command, ...params) {
    let [prefix, ...action] = command.split(':')

    switch (prefix) {
      case 'app':
        return (_, win) => this.app.emit(command, win, ...params)
      case 'win':
        return (_, win) => win[action](...params)
      case 'dispatch':
        return (_, win) => win.webContents.send('dispatch', {
          type: action, payload: params
        })
      default:
        warn(`no responder for menu command ${command}`)
    }
  }

  build(template) {
    return Menu.buildFromTemplate(
      this.translate(template)
        // Hiding of root items does not work at the moment.
        // See Electron #2895
        .filter(item => item.visible !== false)
    )
  }

  translate(template) {
    // eslint-disable-next-line complexity
    return template.map(item => {
      item = { ...item }

      if (item.command) {
        item.click = this.responder(item.command)
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
          item.visible = (this.app.dev || this.app.debug)
          break

        case 'theme':
          for (let theme of item.submenu) {
            theme.checked = (theme.id === this.app.state.theme)
            theme.click = this.responder('app:switch-theme', theme.id)
          }
          break

        case 'undo':
          item.enabled = this.app.history.past > 0
          break

        case 'redo':
          item.enabled = this.app.history.future > 0
          break
      }

      if (item.submenu) {
        item.submenu = this.translate(item.submenu)
      }

      return item
    })
  }

}
