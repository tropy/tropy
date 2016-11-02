'use strict'

const { Command } = require('./command')
const { call } = require('redux-saga/effects')
const mod = require('../models/metadata')

const {
  LOAD
} = require('../constants/metadata')

class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const items = yield call(mod.load, db, payload)

    return items
  }
}

module.exports = {
  Load
}
