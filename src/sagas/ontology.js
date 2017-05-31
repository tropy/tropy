'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY } = require('../constants')
const mod = require('../models/ontology')
const act = require('../actions')
const { call, put, take } = require('redux-saga/effects')

function *ontology(file = join(ARGS.home, ONTOLOGY.DB)) {
  try {
    var db = new Database(file)

    if (yield call(db.empty)) {
      yield call(mod.ontology.create, db)
      verbose('*ontology created db...')

      yield put(act.ontology.import(null, { history: false }))

    } else {
      // migrate
    }

    while (true) {
      yield take(({ meta }) => meta && meta.ontology)
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
