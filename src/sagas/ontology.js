'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY } = require('../constants')
const { exec } = require('./cmd')
const mod = require('../models')
const act = require('../actions')
const { call, fork, take } = require('redux-saga/effects')

const command = ({ error, meta }) =>
  (!error && meta && meta.cmd === 'ontology')

function *ontology(file = join(ARGS.home, ONTOLOGY.DB)) {
  try {
    var db = new Database(file)

    if (yield call(db.empty)) {
      yield call(mod.ontology.create, db)
      verbose('*ontology created db...')

      yield fork(exec, { db }, act.ontology.import(null, { history: false }))

    } else {
      // migrate
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
