'use strict'

const { writeFile } = require('fs').promises
const { clipboard } = require('electron')
const { call, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { warn } = require('../../common/log')
const { fail, save } = require('../../dialog')
const { win } = require('../../window')
const { getExportItems } = require('../../selectors')


class Export extends Command {
  *exec() {
    let { target, plugin } = this.action.meta
    let id = this.action.payload

    if (plugin) target = ':plugin:'

    try {
      if (!target) {
        this.suspend()
        target = yield call(save.items, {})
        this.resume()
      }

      if (!target) return

      let items = yield select(state => getExportItems(state, { id }))

      switch (target) {
        case ':clipboard:':
          yield call(clipboard.writeText, JSON.stringify(items, null, 2))
          break
        case ':plugin:':
          yield win.plugins.export(plugin, items)
          break
        default:
          yield call(writeFile, target, JSON.stringify(items, null, 2))
      }
    } catch (e) {
      warn({ stack: e.stack }, `failed to export items to ${target}`)
      fail(e, this.action.type)
    }
  }
}

Export.register(ITEM.EXPORT)

module.exports = {
  Export
}
