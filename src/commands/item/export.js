'use strict'

const { writeFile } = require('fs').promises
const { clipboard } = require('electron')
const { call, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { warn } = require('../../common/log')
const { fail, save } = require('../../dialog')
const { win } = require('../../window')
const { getGroupedItems } = require('../../selectors')
const { groupedByTemplate } = require('../../export')


class Export extends Command {
  *exec() {
    let { target, plugin } = this.action.meta
    let ids = this.action.payload

    if (plugin) target = ':plugin:'

    try {
      if (!target) {
        this.suspend()
        target = yield call(save.items, {})
        this.resume()
      }

      if (!target) return

      let [opts, [items, ...resources]] = yield select(state => ([
        state.settings.export,
        getGroupedItems(ids)(state)
      ]))

      let results = yield call(groupedByTemplate, items, resources, opts)
      let asString = JSON.stringify(results, null, 2)

      switch (target) {
        case ':clipboard:':
          yield call(clipboard.writeText, asString)
          break
        case ':plugin:':
          yield win.plugins.export(plugin, results)
          break
        default:
          yield call(writeFile, target, asString)
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
