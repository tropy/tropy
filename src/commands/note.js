'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
const act = require('../actions')
const { NOTE } = require('../constants')
const { keys } = Object


class Load extends Command {
  static get action() { return NOTE.LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const notes = yield call(mod.note.load, db, ids)

    return notes
  }
}

class Create extends Command {
  static get action() { return NOTE.CREATE }

  *exec() {
    const { db } = this.options
    const { text, item, photo } = this.action.payload

    const [parent, add] = (item) ?
      [item, act.item.notes.add] : [photo, act.photo.notes.add]

    const notes = keys(
      yield call(mod.note.create, db, { id: parent, text })
    )

    yield put(add({ id: parent, notes }))

    this.undo = act.note.delete({ item, photo, notes })
    this.redo = act.note.restore({ item, photo, notes })

    return note
  }
}

class Save extends Command {
  static get action() { return NOTE.SAVE }

  *exec() {
    const { db } = this.options
    const { id, text } = this.action.payload

    const original = yield select(({ notes }) => notes[id])
    const data = { id, text }

    yield call(mod.save, db, data)
    yield put(act.note.update(data))

    this.undo(act.note.save({ id, text: original.text }))

    return data
  }
}

class Delete extends Command {
  static get action() { return NOTE.DELETE }

  *exec() {
    const { db } = this.options
    const { item, photo, notes } = this.action.payload

    const [parent, remove] = (item) ?
      [item, act.item.notes.remove] : [photo, act.photo.notes.remove]


    yield call([db, db.transaction], async tx => {
      await mod.note.delete(tx, notes)
    })

    yield put(remove({ id: parent, notes }))

    this.undo = act.note.restore(this.action.payload)

    return this.action.payload
  }
}

class Restore extends Command {
  static get action() { return NOTE.RESTORE }

  *exec() {
    const { db } = this.options
    const { item, photo, notes } = this.action.payload

    const [parent, add] = (item) ?
      [item, act.item.notes.add] : [photo, act.photo.notes.add]

    yield call(mod.note.restore, db, notes)
    yield put(add({ id: parent, notes }))

    this.undo = act.note.delete(this.action.payload)

    return this.action.payload
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Save
}
