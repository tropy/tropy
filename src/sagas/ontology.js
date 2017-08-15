'use strict'

require('../common/promisify')

const { join } = require('path')
const { Database } = require('../common/db')
const { Ontology } = require('../common/ontology')
const { verbose, warn } = require('../common/log')
const { ONTOLOGY, ITEM, SELECTION } = require('../constants')
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
      join(Ontology.base, '..', 'ttp', 'item.ttp'),
      join(Ontology.base, '..', 'ttp', 'selection.ttp')
    ],
    isProtected: true
  }, { history: false }))
}

// TODO upgrade templates via js migrations
function *refresh(db, id, date, file) {
  if (yield call(mod.ontology.template.stale, db, { id, date })) {
    verbose(`updating default ${file}...`)
    yield call(exec, { db }, act.ontology.template.import({
      files: [join(Ontology.base, '..', 'ttp', file)],
      isProtected: true
    }, { history: false, replace: true }))
  }
}


function *migrate(db) {
  yield call(db.migrate, ONTOLOGY.MIGRATIONS)

  yield call(refresh, db, ITEM.TEMPLATE, '2017-07-19', 'item.ttp')
  yield call(refresh, db, SELECTION.TEMPLATE, '2017-08-14', 'selection.ttp')

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
