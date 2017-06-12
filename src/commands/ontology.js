'use strict'

const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')
const { VOCAB, PROPS, CLASS } = ONTOLOGY
const { Ontology } = require('../common/ontology')
const { openVocabs, fail  } = require('../dialog')
const { verbose, warn } = require('../common/log')
const { pick } = require('../common/util')
const { all, call, select } = require('redux-saga/effects')
const act = require('../actions')
const mod = require('../models')
const { keys } = Object


class Import extends Command {
  static get action() { return ONTOLOGY.IMPORT }

  *exec() {
    const { db } = this.options
    let { files } = this.action.payload

    if (!files) {
      files = yield call(openVocabs)
      this.init = performance.now()
    }

    if (!files) return

    let vocabs = []

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file = files[i]

      try {
        let data = (yield call(Ontology.open, file, false)).toJSON()

        yield call(db.transaction, async tx => {
          for (let id in data) {
            await mod.ontology.vocab.create(tx, data[id])

            await Promise.all([
              mod.ontology.props.create(tx, ...data[id].properties),
              mod.ontology.class.create(tx, ...data[id].classes),
              mod.ontology.label.create(tx, ...data[id].labels)
            ])

            vocabs.push(id)
          }
        })


      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error)
      }
    }

    if (vocabs.length) {
      this.undo = act.ontology.vocab.delete(vocabs)
      this.redo = act.ontology.vocab.restore(vocabs)

      const [vocab, klass, props] = yield all([
        mod.ontology.vocab.load(db, ...vocabs),
        mod.ontology.class.load(db, ...vocabs),
        mod.ontology.props.load(db, ...vocabs)
      ])

      return { vocab, class: klass, props }
    }
  }
}

class VocabLoad extends Command {
  static get action() { return VOCAB.LOAD }

  *exec() {
    return yield call(mod.ontology.vocab.load, this.options.db)
  }
}

class VocabDelete extends Command {
  static get action() { return VOCAB.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const originals = yield select(({ ontology }) =>
      pick(ontology.vocab, payload))

    yield call(mod.ontology.vocab.delete, db, ...payload)
    this.undo = act.ontology.vocab.restore(originals)

    return payload
  }
}

class VocabRestore extends Command {
  static get action() { return VOCAB.RESTORE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const vocabs = keys(payload)

    yield call(mod.ontology.vocab.restore, db, ...vocabs)
    this.undo = act.ontology.vocab.delete(vocabs)

    return payload
  }
}

class PropsLoad extends Command {
  static get action() { return PROPS.LOAD }

  *exec() {
    return yield call(mod.ontology.props.load, this.options.db)
  }
}

class ClassLoad extends Command {
  static get action() { return CLASS.LOAD }

  *exec() {
    return yield call(mod.ontology.class.load, this.options.db)
  }
}


module.exports = {
  ClassLoad,
  Import,
  PropsLoad,
  VocabDelete,
  VocabLoad,
  VocabRestore
}
