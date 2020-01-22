'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')

const act = require('../../actions')
const mod = require('../../models')

const {
  getItemTemplate,
  getTemplateValues
} = require('../../selectors')


class Create extends Command {
  *exec() {
    let { db } = this.options

    let template = yield select(getItemTemplate)
    let data = getTemplateValues(template)

    let item = yield call(db.transaction, tx =>
      mod.item.create(tx, template.id, data))

    yield put(act.item.insert(item))
    yield put(act.item.select({ items: [item.id] }, { mod: 'replace' }))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])

    return item
  }
}

Create.register(ITEM.CREATE)

module.exports = {
  Create
}
