import assert from 'assert'
import fs from 'fs'
import { call, select } from 'redux-saga/effects'
import ARGS from '../args'
import { Command } from './command'
import { CACHE } from '../constants'
import { Cache } from '../common/cache'
import { get } from '../common/util'
import { debug, info, warn } from '../common/log'

const UUID = /^[0-9a-f]{8}(-[0-9a-f]+){4}$/i

export class Prune extends Command {
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
      try {
        if (!Prune.check(file, state)) continue

        debug(`removing ${file}`)
        yield call(fs.promises.unlink, cache.expand(file))
        stale.push(file)

      } catch (e) {
        warn({ stack: e.stack }, `prune: failed removing ${file}`)
      }
    }

    if (stale.length) {
      info(`cleared ${stale.length} file(s) from cache`)
    }

    return stale
  }
}

Prune.register(CACHE.PRUNE)


export class Purge extends Command {
  *exec() {
    let AGE = 3 // months
    let NOW = new Date()

    let state = yield select()
    let cache = new Cache(ARGS.cache)
    let stale = []

    let exists = yield call(cache.exists)

    assert(exists, 'cache does not exist')
    assert(state.recent != null, 'cannot purge caches without state')

    info(`purging cache ${cache.root}`)
    let stats = yield call(cache.stats)

    for (let [id, stat] of stats) {
      if (!stat.isDirectory()) continue
      if (!UUID.test(id)) continue

      let timestamp = get(state.recent, [id, 'opened'], stat.ctimeMs)
      assert(timestamp > 0, 'invalid cache directory timestamp')

      let date = addMonths(AGE, new Date(timestamp))
      if (date > NOW) continue

      info(`removing old project cache ${id}`)
      yield call(fs.promises.rm, cache.expand(id), { recursive: true })
      stale.push(id)
    }

    return stale
  }
}

Purge.register(CACHE.PURGE)

const addMonths = (k = 0, d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + k, d.getDate())
