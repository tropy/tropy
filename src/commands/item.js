'use strict'

const { warn } = require('../common/log')
const { clipboard, ipcRenderer: ipc } = require('electron')
const { Command } = require('./command')
const { SaveCommand } = require('./subject')
const { groupedByTemplate } = require('../export')
const { fail, save } = require('../dialog')
const mod = require('../models')
const { darwin } = require('../common/os')
const { ITEM } = require('../constants')
const { writeFile: write } = require('fs')
const { win } = require('../window')
const { get } = require('../common/util')

const {
  call,
  select,
  cps
} = require('redux-saga/effects')

const {
  getGroupedItems,
  getPrintableItems
} = require('../selectors')


class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let items = yield call(db.seq, conn =>
      mod.item.load(conn, payload))

    return items
  }
}

Load.register(ITEM.LOAD)


class TemplateChange extends SaveCommand {
  type = 'item'
}
TemplateChange.register(ITEM.TEMPLATE.CHANGE)


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
          yield cps(write, target, asString)
      }
    } catch (e) {
      warn({ stack: e.stack }, `failed to export items to ${target}`)
      fail(e, this.action.type)
    }
  }
}

Export.register(ITEM.EXPORT)



class Preview extends Command {
  *exec() {
    if (!darwin) return

    let { photos } = this.action.payload
    let paths = yield select(state =>
      photos.map(id => get(state.photos, [id, 'path'])))

    if (paths.length > 0) {
      win.preview(paths[0])
    }
  }
}

Preview.register(ITEM.PREVIEW)


class Print extends Command {
  *exec() {
    let [prefs, project, items] = yield select(state => ([
      state.settings.print,
      state.project.id,
      getPrintableItems(state)
    ]))

    if (items.length) {
      ipc.send('print', { ...prefs, project, items })
    }
  }
}

Print.register(ITEM.PRINT)


module.exports = {
  ...require('./item/create'),
  ...require('./item/explode'),
  ...require('./item/import'),
  ...require('./item/merge'),
  ...require('./item/tags'),

  Export,
  Load,
  TemplateChange,
  Preview,
  Print
}
