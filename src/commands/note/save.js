import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import mod from '../../models/note'
import act from '../../actions/note'
import { NOTE } from '../../constants'


class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { id, state, text } = payload
    let modified = new Date
    let data = { id, state, text, modified }

    this.original = yield select(({ notes }) => notes[id])

    yield put(act.update(data))

    if (!meta.blank) {
      yield call(mod.save, db, {
        id,
        state,
        text: meta.changed ? text : undefined
      },  modified)

      this.undo = act.save({
        id,
        text: this.original.text,
        state: this.original.state
      })
    }

    return data
  }

  *abort() {
    if (this.original) {
      yield put(act.update(this.original))
    }
  }
}

Save.register(NOTE.SAVE)
