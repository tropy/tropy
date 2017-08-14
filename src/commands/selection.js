'use strict'

const { call } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
//const act = require('../actions')
const { SELECTION } = require('../constants')

class Create extends Command {
  static get action() { return SELECTION.CREATE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const selection = yield call(db.transaction, tx =>
      mod.selection.create(tx, null, payload))

    //this.undo = act.selection.delete()
    //this.redo = act.selection.restore()

    return selection

  }
}

class Load extends Command {
  static get action() { return SELECTION.LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    return yield call(mod.selection.load, db, payload)
  }
}

module.exports = {
  Create,
  Load
}
