'use strict'

const res = require('../common/res')
const { warn } = require('../common/log')
// const { format } = require('util')
const { Menu } = require('electron')

module.exports = class AppMenu {
  constructor(app) {
    this.app = app
  }

  async load(name = 'app') {
    this.unload()

    let menu = await res.Menu.open(name)
    this.template = this.translate(menu.template)

    Menu.setApplicationMenu(Menu.buildFromTemplate(this.template))
  }

  unload() {
    if (this.template) this.unbind(this.template)
  }

  unbind(template) {
    for (let item of template) {
      delete item.click
      if (item.submenu) this.unbind(item.submenu)
    }
  }

  responder(command) {
    let [prefix, action] = command.split(':')

    switch (prefix) {
      case 'application':
        return () => this.app.exec(action)
      case 'window':
        return (_, win) => win[action]()
      default:
        warn(`cannot bind menu command ${command}`)
    }
  }

  translate(template) {
    return template.map(item => {

      if (item.environment) {
        item.visible = item.environment === this.app.environment
      }

      if (item.debug && this.app.debug) {
        item.visible = true
      }

      if (item.command) {
        item.click = this.responder(item.command)
      }

      //item.label = format(item.label, this.app)

      if (item.submenu) {
        item.submenu = this.translate(item.submenu)
      }

      return item
    })
  }

}
