'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { Ontology } = require('../common/ontology')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY } = require('../constants')
const { exec } = require('./cmd')
const mod = require('../models')
const act = require('../actions')
const { call, fork, put, take } = require('redux-saga/effects')

const command = ({ error, meta }) =>
  (!error && meta && meta.cmd === 'ontology')


function *create(db) {
  yield call(mod.ontology.create, db)
  verbose('*ontology created db...')

  yield call(exec, { db }, act.ontology.import({
    files: [
      Ontology.expand('dc')
    ]
  }, { history: false }))
}

function *migrate() {
  // TODO actually migrate
  yield put(act.ontology.load())
}

function *ontology(file = join(ARGS.home, ONTOLOGY.DB)) {
  try {
    var db = new Database(file)

    if (yield call(db.empty)) {
      yield fork(create, db)
    } else {
      yield fork(migrate, db)
    }

    while (true) {
      const action = yield take(command)
      yield fork(exec, { db }, action)
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
