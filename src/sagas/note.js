import { call, delay, fork, put, select, take } from 'redux-saga/effects'
import { debug, warn } from '../common/log.js'
import actions from '../actions/note.js'
import models from '../models/note.js'
import NOTE from '../constants/note.js'

function *save(ms, id, pending) {
  yield delay(ms)
  yield put(actions.save({ id }))
  pending.delete(id)
}

function *flush(db, pending) {
  let notes = yield select(state => state.notes)

  for (let [id] of pending) {
    let { changed, state, text } = notes[id]

    if (!changed)
      continue

    if (text)
      yield call(models.save, db, { id, state, text })
    // else // TODO delete?
  }
}

export function *autosave(db, ms = 5000) {
  try {
    var pending = new Map

    while (true) {
      let action = yield take(NOTE.UPDATE)
      let { id } = action.payload

      let task = pending.get(id)

      if (task?.isRunning())
        task.cancel()

      pending.set(id, yield fork(save, ms, id, pending))
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *note.autosave')

  } finally {
    if (pending.size) {
      debug(`persiting ${pending.size} unsaved note(s)...`)
      yield call(flush, db, pending)
    }

    debug('*note.autosave terminated')
  }
}
