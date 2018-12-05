'use strict'

const { call, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CACHE } = require('../constants')
const { info } = require('../common/log')

class Prune extends Command {
  static get ACTION() { return CACHE.PRUNE }

  *exec() {
    let { cache } = this.options

    info('clearing project cache...')
    let state = yield select()
    let files = yield call(cache.prune, state)
    info(`cleared ${files.length} file(s) from cache...`)

    return files
  }
}

module.exports = {
  Prune
}
