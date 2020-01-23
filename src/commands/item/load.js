'use strict'

const { call } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const mod = require('../../models')


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

module.exports = {
  Load
}
