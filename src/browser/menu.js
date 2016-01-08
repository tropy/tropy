'use strict'

const res = require('../common/res')
const { warn } = require('../common/log')
const { Menu } = require('electron')
const { assign } = Object

module.exports = class AppMenu {
  constructor(app) {
    this.app = app
  }

  update() {
    return Menu.setApplicationMenu(this.menu), this
  }

  clear() {
    delete this.menu
    return this.update()
  }

  async load(name = 'app') {
    if (this.menu) this.clear()

    let template = (await res.Menu.open(name)).template
    this.menu = this.build(template)

    return this.update()
  }

  responder(command) {
    let [prefix, action] = command.split(':')

    switch (prefix) {
      case 'application':
        return (_, win) => this.app.emit(command, win)
      case 'window':
        return (_, win) => win[action]()
      default:
        warn(`no responder for menu command ${command}`)
    }
  }

  build(template) {
    return Menu.buildFromTemplate(this.translate(template))
  }

  translate(template) {
    return template.map(item => {
      item = assign({}, item)

      // Hiding of root items does not work at the moment.
      // See Electron #2895

      if (item.environment) {
        item.visible = item.environment === this.app.environment
      }

      if (item.debug && this.app.debug) {
        item.visible = true
      }

      if (item.command) {
        item.click = this.responder(item.command)
      }

      if (item.label) {
        item.label = item.label
          .replace(/%(\w+)/g, (_, prop) => this.app[prop])
      }

      if (item.submenu) {
        item.submenu = this.translate(item.submenu)
      }

      return item
    })
  }

}
