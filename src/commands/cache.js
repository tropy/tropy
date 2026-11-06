import assert from 'node:assert'
import fs from 'node:fs'
import { call, select } from 'redux-saga/effects'
import ARGS from '../args.js'
import { Command } from './command.js'
import { CACHE } from '../constants/index.js'
import { Cache } from '../common/cache.js'
import { get } from '../common/util.js'
import { debug, info, warn } from '../common/log.js'

const UUID = /^[0-9a-f]{8}(-[0-9a-f]+){4}$/i

export class Prune extends Command {
  static check (file, state) {
    let [id,, ext] = Cache.split(file)
    return ext !== Cache.extname() ||
      !((id in state.photos || (id in state.selections)))
  }

  *exec () {
    let { cache } = this.options
    let START = Date.now()

    let files = yield call(cache.list)
    let state = yield select()
    let stale = []

    assert(state.photos != null && state.selections != null,
      'cannot prune project cache without state')

    for (let file of files) {
      try {
        if (!Prune.check(file, state)) continue

        debug({ path: file }, 'removing cache file')
        yield call(fs.promises.unlink, cache.expand(file))
        stale.push(file)

      } catch (err) {
        warn({ err, path: file }, 'failed removing cache file')
      }
    }

    info({
      files: files.length,
      removed: stale.length,
      ms: Date.now() - START,
      project: cache.name
    }, 'pruned cache')

    return stale
  }
}

Prune.register(CACHE.PRUNE)


export class Purge extends Command {
  *exec () {
    let AGE = 3 // months
    let NOW = new Date()

    let state = yield select()
    let cache = new Cache(ARGS.cache)
    let stale = []

    let exists = yield call(cache.exists)

    assert(exists, 'cache does not exist')
    assert(state.recent != null, 'cannot purge caches without state')

    let START = Date.now()
    let stats = yield call(cache.stats)

    for (let [id, stat] of stats) {
      if (!stat.isDirectory()) continue
      if (!UUID.test(id)) continue

      // Each window purges on its own, and its recent projects
      // may be stale: a cache opened by another window is touched.
      let timestamp = Math.max(
        get(state.recent, [id, 'opened'], 0),
        stat.mtimeMs)

      let date = addMonths(AGE, new Date(timestamp))
      if (date > NOW) continue

      try {
        info({ project: id }, 'removing old project cache')
        yield call(fs.promises.rm, cache.expand(id), {
          recursive: true,
          force: true
        })
        stale.push(id)

      } catch (err) {
        warn({ err, project: id }, 'failed removing old project cache')
      }
    }

    info({
      removed: stale.length,
      ms: Date.now() - START,
      path: cache.root
    }, 'purged cache')

    return stale
  }
}

Purge.register(CACHE.PURGE)

const addMonths = (k = 0, d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + k, d.getDate())
