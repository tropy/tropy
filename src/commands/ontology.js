import assert from 'assert'
import { writeFile as write } from 'fs'
import { Command } from './command'
import { ONTOLOGY } from '../constants'
import { warn } from '../common/log'
import { Ontology, Template, Vocabulary } from '../ontology'
import { get, pick, pluck } from '../common/util'
import { all, call, select, cps } from 'redux-saga/effects'
import { getTemplateField, getTemplateFields } from '../selectors'
import * as act from '../actions'
import * as mod from '../models'
import sanitize from 'sanitize-filename'
import { join } from 'path'
import { fail, open, save } from '../dialog'


const { VOCAB, PROPS, CLASS, LABEL, TEMPLATE } = ONTOLOGY

export class Import extends Command {
  *exec() {
    let { db } = this.options
    let { files, isProtected } = this.action.payload

    if (!files) {
      files = yield call(open.vocab)
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

            } catch (e) {
              warn({ stack: e.stack }, `failed to import "${id}"`)
              fail(e, this.action.type)
            }
          }
        })


      } catch (e) {
        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
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

Import.register(ONTOLOGY.IMPORT)


export class Load extends Command {
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

Load.register(ONTOLOGY.LOAD)


export class VocabLoad extends Command {
  *exec() {
    return yield call(mod.ontology.vocab.load, this.options.db)
  }
}

VocabLoad.register(VOCAB.LOAD)


export class VocabExport extends Command {
  *exec() {
    let { payload } = this.action
    let [vocab, ontology] = yield select(state => [
      pluck(state.ontology.vocab, payload),
      state.ontology
    ])

    this.isInteractive = true

    let path = yield call(save.vocab)
    if (!path) return

    let data = yield call(Vocabulary.toN3, vocab[0], ontology)
    yield cps(write, path, data)

    return payload
  }
}

VocabExport.register(VOCAB.EXPORT)


export class VocabSave extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action

    assert(payload.id != null)

    const original = yield select(state =>
      pick(state.ontology.vocab[payload.id], Object.keys(payload)))

    yield call(mod.ontology.vocab.update, db, payload)
    this.undo = act.ontology.vocab.save(original)

    return payload
  }
}

VocabSave.register(VOCAB.SAVE)


export class VocabDelete extends Command {
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

VocabDelete.register(VOCAB.DELETE)


export class VocabRestore extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const vocabs = Object.keys(payload)

    yield call(mod.ontology.vocab.restore, db, ...vocabs)
    this.undo = act.ontology.vocab.delete(vocabs)

    return payload
  }
}

VocabRestore.register(VOCAB.RESTORE)


export class PropsLoad extends Command {
  *exec() {
    return yield call(mod.ontology.props.load, this.options.db)
  }
}

PropsLoad.register(PROPS.LOAD)


export class ClassLoad extends Command {
  *exec() {
    return yield call(mod.ontology.class.load, this.options.db)
  }
}

ClassLoad.register(CLASS.LOAD)


export class LabelSave extends Command {
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

LabelSave.register(LABEL.SAVE)


export class TemplateImport extends Command {
  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    let { files, isProtected } = payload

    if (!files) {
      files = yield call(open.templates)
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

      } catch (e) {
        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
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

TemplateImport.register(TEMPLATE.IMPORT)


export class TemplateExport extends Command {
  *exec() {
    let { id, path } = this.action.payload

    try {
      const data = yield select(state => state.ontology.template[id])
      assert(data != null, 'missing template')

      if (!path) {
        this.isInteractive = true
        path = yield call(save.template, {
          defaultPath: join(
            ARGS.documents,
            data.name ? sanitize(`${data.name}.ttp`) : ''
          )
        })
      }

      if (!path) return

      yield call(Template.save, data, path)

    } catch (e) {
      warn({ stack: e.stack }, `failed to export template ${id} to ${path}`)
      fail(e, this.action.type)
    }
  }
}

TemplateExport.register(TEMPLATE.EXPORT)


export class TemplateCreate extends Command {
  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action

    let ids = []
    let temps = {}

    for (let id in payload) {
      try {
        yield call(createTemplate, db, { ...payload[id], id }, meta)
        ids.push(id)

      } catch (e) {
        warn({ stack: e.stack }, `failed to create template "${id}"`)
        fail(e, this.action.type)
      }
    }

    if (ids.length > 0) {
      temps = yield call(mod.ontology.template.load, db, ...ids)
      this.undo = act.ontology.template.delete(ids)
    }

    return temps
  }
}

TemplateCreate.register(TEMPLATE.CREATE)


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


export class TemplateSave extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const original = yield select(state =>
      pick(state.ontology.template[payload.id], Object.keys(payload)))

    yield call(mod.ontology.template.save, db, payload)
    this.undo = act.ontology.template.save(original)

    return payload
  }
}

TemplateSave.register(TEMPLATE.SAVE)


export class TemplateDelete extends Command {
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

TemplateDelete.register(TEMPLATE.DELETE)


export class TemplateFieldAdd extends Command {
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

TemplateFieldAdd.register(TEMPLATE.FIELD.ADD)


export class TemplateFieldRemove extends Command {
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

TemplateFieldRemove.register(TEMPLATE.FIELD.REMOVE)


export class TemplateFieldSave extends Command {
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
      id, field: pick(original.field, Object.keys(field))
    })

    return payload
  }
}

TemplateFieldSave.register(TEMPLATE.FIELD.SAVE)


export class TemplateFieldOrder extends Command {
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

TemplateFieldOrder.register(TEMPLATE.FIELD.ORDER)
