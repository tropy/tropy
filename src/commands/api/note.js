import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { API } from '../../constants'
import { fromHTML, serialize } from '../../editor/serialize'
import * as act from '../../actions'
import * as mod from '../../models'


export class NoteCreate extends Command {
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


export class NoteShow extends Command {
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
