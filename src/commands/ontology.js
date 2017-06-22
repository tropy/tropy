'use strict'

const assert = require('assert')
const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')
const { VOCAB, PROPS, CLASS, LABEL, TEMPLATE } = ONTOLOGY
const { Ontology, Template } = require('../common/ontology')
const { openTemplates, openVocabs, fail  } = require('../dialog')
const { verbose, warn } = require('../common/log')
const { get, pick } = require('../common/util')
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
              mod.ontology.label.save(tx, ...data[id].labels)
            ])

            vocabs.push(id)
          }
        })


      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error, this.action.type)
      }
    }

    if (vocabs.length) {
      const [vocab, klass, props] = yield all([
        mod.ontology.vocab.load(db, ...vocabs),
        mod.ontology.class.load(db, ...vocabs),
        mod.ontology.props.load(db, ...vocabs)
      ])

      this.undo = act.ontology.vocab.delete(vocabs)
      this.redo = act.ontology.vocab.restore(vocab)

      return { vocab, class: klass, props }
    }
  }
}

class Load extends Command {
  static get action() { return ONTOLOGY.LOAD }

  *exec() {
    const { db } = this.options

    const [vocab, klass, props, template] = yield all([
      mod.ontology.vocab.load(db),
      mod.ontology.class.load(db),
      mod.ontology.props.load(db),
      mod.ontology.template.load(db)
    ])

    return { vocab, class: klass, props, template }
  }
}

class VocabLoad extends Command {
  static get action() { return VOCAB.LOAD }

  *exec() {
    return yield call(mod.ontology.vocab.load, this.options.db)
  }
}

class VocabSave extends Command {
  static get action() { return VOCAB.SAVE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    assert(payload.id != null)

    const original = yield select(state =>
      pick(state.ontology.vocab[payload.id], keys(payload)))

    yield call(mod.ontology.vocab.update, db, payload)
    this.undo = act.ontology.vocab.save(original)

    return payload
  }
}

class VocabDelete extends Command {
  static get action() { return VOCAB.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const originals = yield select(state =>
      pick(state.ontology.vocab, payload))

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

class LabelSave extends Command {
  static get action() { return LABEL.SAVE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const original = yield select(({ ontology }) =>
      get(ontology, [payload.type, payload.id, 'label']))

    yield call(mod.ontology.label.save, db, payload)

    this.undo = {
      ...this.action,
      payload: { ...payload, label: original }
    }

    return payload
  }
}

class TemplateImport extends Command {
  static get action() { return TEMPLATE.IMPORT }

  *exec() {
    const { db } = this.options
    let { files } = this.action.payload

    if (!files) {
      files = yield call(openTemplates)
      this.init = performance.now()
    }

    if (!files) return

    let ids = []
    let temps = {}

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file = files[i]

      try {
        const {
          '@id': id, type, name, field: fields
        } = yield call(Template.open, file)

        ids.push(yield call(createTemplate, db, { id, type, name, fields }))

      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error, this.action.type)
      }
    }

    if (ids.length > 0) {
      temps = yield call(mod.ontology.template.load, db, ...ids)

      this.undo = act.ontology.template.delete(ids)
      this.redo = act.ontology.template.create(temps)
    }

    return temps
  }
}

class TemplateCreate extends Command {
  static get action() { return TEMPLATE.CREATE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    let ids = []

    for (let id in payload) {
      yield call(createTemplate, db, { ...payload[id], id })
      ids.push(id)
    }

    this.undo = act.ontology.template.delete(ids)

    return payload
  }

}

async function createTemplate(db, data) {
  assert(data.id != null, 'missing template id')

  await db.transaction(async tx => {
    await mod.ontology.template.create(tx, data)

    await Promise.all([
      mod.ontology.field.add(tx, data.id, ...data.fields)
    ])
  })

  return data.id
}


class TemplateDelete extends Command {
  static get action() { return TEMPLATE.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const originals = yield select(state =>
      pick(state.ontology.template, payload))

    yield call(mod.ontology.template.delete, db, ...payload)
    this.undo = act.ontology.template.create(originals)

    return payload
  }
}




module.exports = {
  ClassLoad,
  Import,
  LabelSave,
  Load,
  PropsLoad,
  TemplateCreate,
  TemplateImport,
  TemplateDelete,
  VocabDelete,
  VocabLoad,
  VocabRestore,
  VocabSave
}
