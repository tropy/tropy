'use strict'

const res = require('../common/res')
const { format } = require('util')
const { Menu } = require('electron')

module.exports = class AppMenu {
  constructor(app) {
    this.app = app
  }

  async load(name = 'app') {
    this.unload()

    let menu = await res.Menu.open(name)

    Menu.setApplicationMenu(
      Menu.buildFromTemplate(this.translate(menu.template))
    )
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

  translate(template) {
    return template.map(item => {
      if (item.environment) {
        item.visible = item.environment === this.app.environment
      }

      if (item.debug) {
        item.visible = this.app.debug
      }

      if (item.visible) {
        if (item.command) {
          item.click = () => this.app.exec(item.command)
        }

        item.label = format(item.label, this.app)

        if (item.submenu) {
          item.submenu = this.translate(item.submenu)
        }
      }

      return item
    })
  }
}
