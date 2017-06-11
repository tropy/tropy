'use strict'

const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')
const { VOCAB, PROPS, TYPES } = ONTOLOGY
const { Ontology } = require('../common/ontology')
const { openVocabs, fail  } = require('../dialog')
const { verbose, warn } = require('../common/log')
const { call } = require('redux-saga/effects')
// const act = require('../actions')
const mod = require('../models')


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
          }
        })

      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error)
      }
    }

    // if (vocabs.length) {
    //   this.undo = act.vocab.delete(vocabs)
    //   this.redo = act.vocab.restore(vocabs)
    // }
  }
}

class VocabLoad extends Command {
  static get action() { return VOCAB.LOAD }

  *exec() {
    return yield call(mod.ontology.vocab.load, this.options.db)
  }
}

class PropsLoad extends Command {
  static get action() { return PROPS.LOAD }

  *exec() {
    return yield call(mod.ontology.props.load, this.options.db)
  }
}

class TypesLoad extends Command {
  static get action() { return TYPES.LOAD }

  *exec() {
    return yield call(mod.ontology.types.load, this.options.db)
  }
}


module.exports = {
  Import,
  PropsLoad,
  TypesLoad,
  VocabLoad
}
