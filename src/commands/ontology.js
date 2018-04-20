'use strict'

const assert = require('assert')
const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')
const { VOCAB, PROPS, CLASS, LABEL, TEMPLATE } = ONTOLOGY
const { Ontology, Template } = require('../common/ontology')
const { verbose, warn } = require('../common/log')
const { get, pick, pluck } = require('../common/util')
const { all, call, select, cps } = require('redux-saga/effects')
const { getTemplateField, getTemplateFields } = require('../selectors')
const act = require('../actions')
const mod = require('../models')
const sanitize = require('sanitize-filename')
const { join } = require('path')
const { keys } = Object
const dialog = require('../dialog')
const { writeFile: write } = require('fs')
const { toN3 } = require('../export/vocab')


class Import extends Command {
  static get action() { return ONTOLOGY.IMPORT }

  *exec() {
    const { db } = this.options
    let { files, isProtected } = this.action.payload

    if (!files) {
      files = yield call(dialog.open.vocab)
      this.init = performance.now()
    }

    if (!files) return

    let vocabs = []

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file = files[i]

      try {
        let data = (yield call(Ontology.open, file, false)).toJSON(ARGS.locale)

        yield call(db.transaction, async tx => {
          for (let id in data) {
            try {
              await mod.ontology.vocab.create(tx, { ...data[id], isProtected })

              await Promise.all([
                mod.ontology.props.create(tx, ...data[id].properties),
                mod.ontology.class.create(tx, ...data[id].classes),
                mod.ontology.type.create(tx, ...data[id].datatypes),
                mod.ontology.label.save(tx, ...data[id].labels)
              ])

              vocabs.push(id)

            } catch (error) {
              warn(`Failed to import "${id}": ${error.message}`)
              verbose(error.stack)
              dialog.fail(error, this.action.type)
            }
          }
        })


      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)
        dialog.fail(error, this.action.type)
      }
    }

    if (vocabs.length) {
      const [vocab, klass, type, props] = yield all([
        mod.ontology.vocab.load(db, ...vocabs),
        mod.ontology.class.load(db, ...vocabs),
        mod.ontology.type.load(db, ...vocabs),
        mod.ontology.props.load(db, ...vocabs)
      ])

      this.undo = act.ontology.vocab.delete(vocabs)
      this.redo = act.ontology.vocab.restore(vocab)

      return { vocab, class: klass, type, props }
    }
  }
}

class Load extends Command {
  static get action() { return ONTOLOGY.LOAD }

  *exec() {
    const { db } = this.options

    const [vocab, klass, type, props, template] = yield all([
      mod.ontology.vocab.load(db),
      mod.ontology.class.load(db),
      mod.ontology.type.load(db),
      mod.ontology.props.load(db),
      mod.ontology.template.load(db)
    ])

    return { vocab, class: klass, type, props, template }
  }
}

class VocabLoad extends Command {
  static get action() { return VOCAB.LOAD }

  *exec() {
    return yield call(mod.ontology.vocab.load, this.options.db)
  }
}

class VocabExport extends Command {
  static get action() { return VOCAB.EXPORT }

  *exec() {
    const { payload } = this.action
    const [vocab, classes, props, types] =
          yield select(state => [
            pluck(state.ontology.vocab, payload),
            state.ontology.class,
            state.ontology.props,
            state.ontology.type
          ])

    this.isInteractive = true

    const path = yield call(dialog.save.vocab)
    if (!path) return

    const data = yield call(toN3, vocab[0], classes, props, types)

    yield cps(write, path, data)

    return payload
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
    const { payload, meta } = this.action
    let { files, isProtected } = payload

    if (!files) {
      files = yield call(dialog.open.templates)
      this.init = performance.now()
    }

    if (!files) return

    let ids = []
    let temps = {}

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file = files[i]

      try {
        const {
          '@id': id,
          type,
          name,
          version,
          creator,
          description,
          field: fields
        } = yield call(Template.open, file)

        ids.push(yield call(createTemplate, db, {
          id,
          type,
          name,
          version,
          creator,
          description,
          fields,
          isProtected
        }, meta))

      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        dialog.fail(error, this.action.type)
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

class TemplateExport extends Command {
  static get action() { return TEMPLATE.EXPORT }

  *exec() {
    let { id, path } = this.action.payload

    try {
      const data = yield select(state => state.ontology.template[id])
      assert(data != null, 'missing template')

      if (!path) {
        this.isInteractive = true
        path = yield call(dialog.save.template, {
          defaultPath: join(
            ARGS.documents,
            data.name ? sanitize(`${data.name}.ttp`) : ''
          )
        })
      }

      if (!path) return

      yield call(Template.save, data, path)

    } catch (error) {
      warn(`Failed to export template ${id} to ${path}: ${error.message}`)
      verbose(error.stack)

      dialog.fail(error, this.action.type)
    }
  }
}

class TemplateCreate extends Command {
  static get action() { return TEMPLATE.CREATE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action

    let ids = []
    let temps = {}

    for (let id in payload) {
      try {
        yield call(createTemplate, db, { ...payload[id], id }, meta)
        ids.push(id)

      } catch (error) {
        warn(`Failed to create template "${id}": ${error.message}`)
        verbose(error.stack)

        dialog.fail(error, this.action.type)
      }
    }

    if (ids.length > 0) {
      temps = yield call(mod.ontology.template.load, db, ...ids)
      this.undo = act.ontology.template.delete(ids)
    }

    return temps
  }

}

async function createTemplate(db, data, meta) {
  assert(data.id != null, 'missing template id')
  assert(data.name != null, 'missing template name')
  assert(data.type != null, 'missing template type')

  const replace = meta && meta.replace

  await db.transaction(async tx => {
    await mod.ontology.template.create(tx, data, { replace })

    if (data.fields != null && data.fields.length > 0) {
      await Promise.all([
        mod.ontology.template.field.add(tx, data.id, ...data.fields)
      ])
    }
  })

  return data.id
}


class TemplateSave extends Command {
  static get action() { return TEMPLATE.SAVE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const original = yield select(state =>
      pick(state.ontology.template[payload.id], keys(payload)))

    yield call(mod.ontology.template.save, db, payload)
    this.undo = act.ontology.template.save(original)

    return payload
  }
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


class TemplateFieldAdd extends Command {
  static get action() { return TEMPLATE.FIELD.ADD }

  *exec() {
    const { db } = this.options
    const { id, field } = this.action.payload
    const { idx } = this.action.meta

    const [stmt] =
      yield call(mod.ontology.template.field.add, db, id, {
        ...field, position: idx
      })

    this.undo = act.ontology.template.field.remove({ id, field: stmt.id })

    return { id, fields: [{
      ...field, id: stmt.id
    }] }
  }
}

class TemplateFieldRemove extends Command {
  static get action() { return TEMPLATE.FIELD.REMOVE }

  *exec() {
    const { db } = this.options
    const { id, field } = this.action.payload

    const original = yield select(state =>
      getTemplateField(state, { id, field }))

    yield call(mod.ontology.template.field.remove, db, id, field)

    this.undo = act.ontology.template.field.add(
      { id, field: original.field },
      { idx: original.idx }
    )

    return { id, fields: [field] }
  }
}

class TemplateFieldSave extends Command {
  static get action() { return TEMPLATE.FIELD.SAVE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { id, field } = payload

    const original = yield select(state =>
      getTemplateField(state, { id, field: field.id }))

    // Subtle: currently each field property is saved individually,
    // so if there is a label, we are saving only the label!
    if ('label' in field) {
      yield call(mod.ontology.template.field.label.save, db, field)
    } else {
      yield call(mod.ontology.template.field.save, db, field)
    }

    this.undo = act.ontology.template.field.save({
      id, field: pick(original.field, keys(field))
    })

    return payload
  }
}

class TemplateFieldOrder extends Command {
  static get action() { return TEMPLATE.FIELD.ORDER }

  *exec() {
    const { db } = this.options
    const { id, fields } = this.action.payload

    const original = yield select(state =>
      getTemplateFields(state, { id }).map(f => f.id))

    yield call(mod.ontology.template.field.order, db, id, fields)

    this.undo = act.ontology.template.field.order({
      id, fields: original
    })

    return { id, fields }
  }
}


module.exports = {
  ClassLoad,
  Import,
  LabelSave,
  Load,
  PropsLoad,
  TemplateCreate,
  TemplateExport,
  TemplateFieldAdd,
  TemplateFieldOrder,
  TemplateFieldRemove,
  TemplateFieldSave,
  TemplateImport,
  TemplateDelete,
  TemplateSave,
  VocabDelete,
  VocabExport,
  VocabLoad,
  VocabRestore,
  VocabSave
}
