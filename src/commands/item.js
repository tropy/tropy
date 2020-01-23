'use strict'

const { Command } = require('./command')
const { SaveCommand } = require('./subject')
const mod = require('../models')
const { ITEM } = require('../constants')
const { call } = require('redux-saga/effects')


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


module.exports = {
  ...require('./item/create'),
  ...require('./item/explode'),
  ...require('./item/export'),
  ...require('./item/import'),
  ...require('./item/merge'),
  ...require('./item/preview'),
  ...require('./item/print'),
  ...require('./item/tags'),

  Load,
  TemplateChange
}
