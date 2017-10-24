'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY } = require('../constants')
const { exec } = require('./cmd')
const mod = require('../models')
const act = require('../actions')
const { call, cps, fork, take } = require('redux-saga/effects')
const { unlink } = require('fs')

const command = ({ type, error, meta }) =>
  (!error && meta && meta.cmd === 'ontology') || type === ONTOLOGY.RESET


function *reset(db) {
  verbose('*ontology resetting db...')

  yield call(db.close)
  yield cps(unlink, db.path)

  db = new Database(db.path)
  yield call(mod.ontology.create, db)
  yield call(exec, { db }, act.ontology.load())

  return db
}

function *ontology(file = join(ARGS.home, ONTOLOGY.DB)) {
  try {
    var db = new Database(file)

    if (yield call(db.empty)) {
      yield call(mod.ontology.create, db)
    } else {
      yield call(db.migrate, ONTOLOGY.MIGRATIONS)
    }

    yield call(exec, { db }, act.ontology.load())

    while (true) {
      const action = yield take(command)

      switch (action.type) {
        case ONTOLOGY.RESET:
          db = yield call(reset, db)
          break
        default:
          yield fork(exec, { db }, action)
      }
    }

  } catch (error) {
    warn(`unexpected error in *ontology: ${error.message}`)
    verbose(error.stack)

  } finally {
    if (db) {
      yield call(mod.ontology.vocab.prune, db)
      yield call(mod.ontology.label.prune, db)
      yield call(db.close)
    }

    verbose('*ontology terminated')
  }
}

module.exports = {
  ontology
}
