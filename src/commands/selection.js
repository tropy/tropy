'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const subject = require('./subject')
const { Image } = require('../image')
const mod = require('../models')
const act = require('../actions')
const { SELECTION } = require('../constants')
const { pick } = require('../common/util')
const { keys } = Object

const {
  getSelectionTemplate,
  getTemplateValues
} = require('../selectors')


class Create extends Command {
  *exec() {
    let { cache, db } = this.options
    let { payload, meta } = this.action

    let [photo, template, density] = yield select(state => ([
      state.photos[payload.photo],
      getSelectionTemplate(state),
      state.settings.density
    ]))

    let image = yield call(Image.open, {
      ...photo,
      density: photo.density || density
    })

    let idx = (meta.idx != null) ?
      meta.idx :
      [photo.selections.length]

    let data = getTemplateValues(template)

    let selection = yield call(db.transaction, tx =>
      mod.selection.create(tx, {
        data,
        template: template.id,
        ...payload
      }))

    yield call(cache.consolidate, selection.id, image, {
      selection
    })

    let selections = [selection.id]
    let position = { idx }

    yield put(act.photo.selections.add({
      id: photo.id,
      selections
    }, position))

    this.undo = act.selection.delete({
      photo: photo.id,
      selections
    }, position)

    this.redo = act.selection.restore({
      photo: photo.id,
      selections
    }, position)

    return selection
  }
}

Create.register(SELECTION.CREATE)


class Load extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const selections = yield call(db.seq, conn =>
      mod.selection.load(conn, payload))

    return selections
  }
}

Load.register(SELECTION.LOAD)


class Order extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { photo, selections } = payload

    const cur = yield select(({ photos }) => photos[photo].selections)

    yield call(mod.selection.order, db, photo, selections)
    yield put(act.photo.update({ id: photo, selections }))

    this.undo = act.selection.order({ photo, selections: cur })
  }
}

Order.register(SELECTION.ORDER)


class Save extends Command {
  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const { id, data } = payload

    const original = yield select(state =>
      pick(state.selections[id], keys(data)))

    yield call(db.transaction, tx =>
      mod.image.save(tx, { id, timestamp: meta.now, ...data }))

    this.undo = act.selection.save({ id, data: original })

    return { id, ...data }
  }
}

Save.register(SELECTION.SAVE)


class TemplateChange extends subject.Save {
  type = 'selection'
}

TemplateChange.register(SELECTION.TEMPLATE.CHANGE)


module.exports = {
  Create,
  Load,
  Order,
  Save,
  TemplateChange,

  ...require('./selection/index')
}
