'use strict'

const { debug, warn } = require('../common/log')

debug('ontology 1')
const { Database } = require('../common/db')
debug('ontology 2')
const { ONTOLOGY } = require('../constants')
debug('ontology 3')
const { exec } = require('./cmd')
debug('ontology 4')
const { fail } = require('../dialog')
debug('ontology 5')
const { user } = require('../path')
debug('ontology 6')
const mod = require('../models')
debug('ontology 7')
const act = require('../actions')
debug('ontology 8')
const { call, fork, take } = require('redux-saga/effects')
debug('ontology 9')

const command = ({ error, meta }) =>
  (!error && meta && meta.cmd === 'ontology')

debug('ontology 10')
function *ontology({ file = user(ONTOLOGY.DB), ...opts } = {}) {
  try {
    var db = new Database(file, 'w+', opts)

    if (yield call(db.empty)) {
      yield call(mod.ontology.create, db)
    } else {
      try {
        yield call(db.migrate, ONTOLOGY.MIGRATIONS)
      } catch (error) {
        warn('failed to migrate ontology database', { stack: error.stack })
        yield call(fail, error, 'ontology.migrate')
      }
    }

    yield call(exec, { db }, act.ontology.load())

    while (true) {
      let action = yield take(command)
      yield fork(exec, { db }, action)
    }

  } catch (e) {
    warn(`unexpected error in *ontology: ${e.message}`, {
      stack: e.stack
    })

  } finally {
    if (db) {
      yield call(mod.ontology.vocab.prune, db)
      yield call(mod.ontology.label.prune, db)
      yield call(db.close)
    }

    debug('*ontology terminated')
  }
}

debug('ontology 11')

module.exports = {
  ontology
}
