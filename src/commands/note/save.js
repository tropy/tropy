import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import mod from '../../models/note'
import act from '../../actions/note'
import { NOTE } from '../../constants'


class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { id, state, text, modified } = payload

    let original = yield select(({ notes }) => notes[id])
    let data = { id, state, text, modified }

    yield call(mod.save, db, {
      id, state, text: meta.changed ? text : undefined
    },  modified)

    yield put(act.update(data))

    this.undo = act.save({
      id,
      text: original.text,
      state: original.state
    })

    return data
  }
}

Save.register(NOTE.SAVE)
