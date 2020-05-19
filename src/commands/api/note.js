'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { API } = require('../../constants')
const { fromHTML, serialize } = require('../../components/editor/serialize')
const act = require('../../actions')
const mod = require('../../models')


class NoteCreate extends Command {
  *exec() {
    let { db } = this.options
    let { html, language, photo, selection } = this.action.payload
    let { state, text } = fromHTML(html)

    let type = (selection != null) ? 'selection' : 'photo'
    let id = (selection != null) ? selection : photo

    let note = yield call(mod.note.create, db, {
      id, state, text, language
    })

    yield put(act[type].notes.add({ id, notes: [note.id] }))
    yield put(act.note.select({ note: note.id, photo, selection }))

    this.undo = act.note.delete({ photo, selection, notes: [note.id] })
    this.redo = act.note.restore({ photo, selection, notes: [note.id] })

    return { [note.id]: note }
  }
}

NoteCreate.register(API.NOTE.CREATE)


class NoteShow extends Command {
  *exec() {
    let { id, format } = this.action.payload

    let note = yield select(state => state.notes[id])

    if (note == null)
      return null

    switch (format) {
      case 'html':
        return serialize(note, { format: { html: true }, localize: false }).html
      case 'plain':
      case 'text':
        return note.text
      case 'md':
      case 'markdown':
        return serialize(note, {
          format: { markdown: true },
          localize: false
        }).markdown
      default:
        return note
    }
  }
}

NoteShow.register(API.NOTE.SHOW)

module.exports = {
  NoteShow
}
