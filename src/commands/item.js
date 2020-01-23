'use strict'

const { ipcRenderer: ipc } = require('electron')
const { Command } = require('./command')
const { SaveCommand } = require('./subject')
const mod = require('../models')
const { darwin } = require('../common/os')
const { ITEM } = require('../constants')
const { win } = require('../window')
const { get } = require('../common/util')

const {
  call,
  select
} = require('redux-saga/effects')

const {
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
  ...require('./item/export'),
  ...require('./item/import'),
  ...require('./item/merge'),
  ...require('./item/tags'),

  Load,
  TemplateChange,
  Preview,
  Print
}
