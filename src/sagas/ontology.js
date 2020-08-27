import { call, fork, take } from 'redux-saga/effects'
import { join } from 'path'
import ARGS from '../args'
import { debug, warn } from '../common/log'
import { Database } from '../common/db'
import { exec, commands } from './cmd'
import { fail } from '../dialog'
import mod from '../models/ontology'
import act from '../actions/ontology'

export function *ontology({
  file = join(ARGS.data, 'ontology.db'),
  ...opts
} = {}) {
  try {
    var db = new Database(file, 'w+', opts)

    if (yield call(db.empty)) {
      yield call(mod.create, db)
    } else {
      try {
        yield call(db.migrate, 'ontology')
      } catch (e) {
        warn({ stack: e.stack }, 'failed to migrate ontology database')
        yield call(fail, e, 'ontology.migrate')
      }
    }

    yield call(exec, { db }, act.load())

    while (true) {
      let action = yield take(commands('ontology'))
      yield fork(exec, { db }, action)
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *ontology')

  } finally {
    if (db) {
      yield call(mod.vocab.prune, db)
      yield call(mod.label.prune, db)
      yield call(db.close)
    }

    debug('*ontology terminated')
  }
}
