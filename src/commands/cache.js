'use strict'

const { call, cps, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CACHE } = require('../constants')
const { info } = require('../common/log')
const { rm } = require('../common/rm')
const { get } = require('../common/util')
const { readdir } = require('fs')
const { join } = require('path')

const PAST = (new Date(2018, 11, 8)).getTime()

const addMonths = (k = 0, d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + k, d.getDate())

class Prune extends Command {
  static get ACTION() { return CACHE.PRUNE }

  *exec() {
    let { cache } = this.options
    let state = yield select()
    let files

    if (state.photos && state.selections) {
      info('clearing project cache...')
      files = yield call(cache.prune, state)
      info(`cleared ${files.length} file(s) from cache...`)
    }

    if (state.recent) {
      info('checking for old project caches...')
      let now = new Date()
      let caches = yield cps(readdir, ARGS.cache)

      for (let id of caches) {
        let date = addMonths(6,
          new Date(get(state.recent, [id, 'opened'], PAST)))

        if (date < now) {
          info(`removing old project cache ${id}...`)
          yield call(rm, join(ARGS.cache, id))
        }
      }
    }

    return files
  }
}

module.exports = {
  Prune
}
