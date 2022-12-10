import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import mod from '../../models/note.js'
import NOTE from '../../constants/note.js'


class Save extends Command {
  *exec() {
    let { db } = this.options
    let { id } = this.action.payload

    let note = yield select(({ notes }) => notes[id])

    if (!note.changed || !note.text)
      return { id }

    let modified = new Date

    yield call(mod.save, db, {
      id,
      state: note.state,
      text: note.text,
      modified
    })

    return { id, modified }
  }
}

Save.register(NOTE.SAVE)
