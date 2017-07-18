'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { Ontology } = require('../common/ontology')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY, ITEM } = require('../constants')
const { exec } = require('./cmd')
const mod = require('../models')
const act = require('../actions')
const { call, fork, put, take } = require('redux-saga/effects')

const command = ({ type, error, meta }) =>
  (!error && meta && meta.cmd === 'ontology') || type === ONTOLOGY.RESET


function *reset(db) {
  verbose('*ontology resetting db...')
  yield call(mod.ontology.clear, db)
  yield* populate(db)
}

function *create(db) {
  verbose('*ontology creating db...')
  yield call(mod.ontology.create, db)
  yield* populate(db)
}

function *populate(db) {
  yield call(exec, { db }, act.ontology.import({
    files: [
      Ontology.expand('tropy'),
      Ontology.expand('xsd'),
      Ontology.expand('dc'),
      Ontology.expand('dcterms'),
      Ontology.expand('rdf'),
      Ontology.expand('rdfs')
    ],
    isProtected: true
  }, { history: false }))

  yield call(exec, { db }, act.ontology.template.import({
    files: [
      join(Ontology.base, '..', 'ttp', 'photo.ttp'),
      join(Ontology.base, '..', 'ttp', 'item.ttp')
    ],
    isProtected: true
  }, { history: false }))
}

function *migrate(db) {
  // TODO actually migrate

  const stale = yield call(mod.ontology.template.stale, db, {
    id: ITEM.TEMPLATE,
    date: '2017-07-19'
  })

  if (stale != null) {
    verbose('updating default item template...')
    yield call(exec, { db }, act.ontology.template.import({
      files: [
        join(Ontology.base, '..', 'ttp', 'item.ttp')
      ],
      isProtected: true
    }, { history: false, replace: true }))
  }

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

      switch (action.type) {
        case ONTOLOGY.RESET:
          yield fork(reset, db)
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
