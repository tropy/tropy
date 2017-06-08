'use strict'

const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')
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

    let vocabs = {}
    let classes = {}
    let properties = {}

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file = files[i]

      try {
        let data = (yield call(Ontology.open, file, false)).toJSON()

        yield call(db.transaction, async tx => {
          for (let id in data) {
            for (let cls of data[id].classes) classes[cls.id] = cls
            for (let prp of data[id].properties) properties[prp.id] = prp

            vocabs[id] = {
              ...data[id],
              classes: data[id].classes.map(p => p.id),
              properties: data[id].properties.map(p => p.id)
            }
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

module.exports = {
  Import
}
