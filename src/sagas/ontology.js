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

function *load() {
  yield put(act.ontology.vocab.load())
  yield put(act.ontology.props.load())
  yield put(act.ontology.types.load())
}

function *ontology(file = join(ARGS.home, ONTOLOGY.DB)) {
  try {
    var db = new Database(file)

    if (yield call(db.empty)) {
      yield call(mod.ontology.create, db)
      verbose('*ontology created db...')

      yield fork(exec, { db }, act.ontology.import({
        files: [
          Ontology.expand('dc')
        ]
      }, { history: false }))

    } else {
      // migrate
      //
      yield fork(load)
    }

    while (true) {
      const action = yield take(command)
      yield fork(exec, { db }, action)
    }

  } catch (error) {
    warn(`unexpected error in *ontology: ${error.message}`)
    verbose(error.stack)

  } finally {
    if (db) yield call(db.close)
  }
}

module.exports = {
  ontology
}
