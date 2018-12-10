'use strict'

const assert = require('assert')
const { call, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CACHE } = require('../constants')
const { Cache } = require('../common/cache')
const { rm } = require('../common/rm')
const { get } = require('../common/util')
const { debug, info } = require('../common/log')


class Prune extends Command {
  static get ACTION() { return CACHE.PRUNE }

  static check(file, state) {
    let [id,, ext] = Cache.split(file)
    return ext !== Cache.extname() ||
      !((id in state.photos || (id in state.selections)))
  }

  *exec() {
    let { cache } = this.options

    let state = yield select()
    let stale = []

    assert(state.photos != null && state.selections != null,
     'cannot prune project cache without state')

    info(`pruning cache ${cache.name}`)
    let files = yield call(cache.list)

    for (let file of files) {
      if (!Prune.check(file, state)) continue

      debug(`removing ${file}`)
      yield call(rm, cache.expand(file))
      stale.push(file)
    }

    if (stale.length) {
      info(`cleared ${stale.length} file(s) from cache`)
    }

    return stale
  }
}


class Purge extends Command {
  static get ACTION() { return CACHE.PURGE }

  *exec() {
    let AGE = 3 // months
    let NOW = new Date()

    let state = yield select()
    let cache = new Cache(ARGS.cache)
    let stale = []

    let exists = yield call(cache.exists)

    assert(exists, 'cache doese not exist')
    assert(cache.name === 'cache', 'not a valid cache root')
    assert(state.recent != null, 'cannot purge caches without state')

    info(`purging cache ${cache.root}`)

    let stats = yield call(cache.stats)

    for (let [id, stat] of stats) {
      if (!stat.isDirectory()) continue

      let timestamp = get(state.recent, [id, 'opened'], stat.ctimeMs)
      assert(timestamp > 0, 'invalid cache directory timestamp')

      let date = addMonths(AGE, new Date(timestamp))
      if (date > NOW) continue

      info(`removing old project cache ${id}`)
      yield call(rm, cache.expand(id))
      stale.push(id)
    }

    return stale
  }
}

const addMonths = (k = 0, d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + k, d.getDate())


module.exports = {
  Prune,
  Purge
}
