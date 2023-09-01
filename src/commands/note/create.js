import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { NOTE } from '../../constants/index.js'
import { getNextNoteSelection, getNotesMap } from '../../selectors/index.js'
import { containsRTL } from '../../common/util.js'
import { fromHTML } from '../../editor/serialize.js'


export class Create extends Command {
  *exec() {
    let { db } = this.options
    let { state, text, photo, selection } = this.action.payload

    if (photo == null) {
      ({ photo, selection } = yield select(({ nav }) => nav))
    }

    let type = (selection != null) ? 'selection' : 'photo'
    let id = (selection != null) ? selection : photo

    if (state == null) {
      ({ state, text } = fromHTML(text))
    }

    let note = yield call(db.transaction, tx =>
      mod.note.create(tx, { id, state, text }))

    // Subtle: for referential-stability in PM
    // keep the non-serialized state object intact!
    note.state = state

    yield put(act[type].notes.add({ id, notes: [note.id] }))
    yield put(act.note.select({ note: note.id, photo, selection }))

    if (text && containsRTL(text))
      yield put(act.notepad.update({
        [note.id]: { direction: 'rtl' }
      }))

    this.undo = act.note.delete([note.id])
    this.redo = act.note.restore([note.id])

    return { [note.id]: note }
  }
}

Create.register(NOTE.CREATE)


export class Delete extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let [isSelected, map] = yield select(state => ([
      payload.includes(state.nav.note),
      getNotesMap(state, { notes: payload })
    ]))

    if (isSelected) {
      let next = yield select(getNextNoteSelection)
      yield put(act.note.select(next && {
        note: next.id,
        photo: next.photo,
        selection: next.selection
      }))
    }

    for (let { id, type, notes } of map.values()) {
      yield put(act[type].notes.remove({ id, notes }))
    }

    yield call(db.transaction, tx => mod.note.delete(tx, payload))
    this.undo = act.note.restore(payload)

    return payload
  }
}

Delete.register(NOTE.DELETE)


export class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let restored = yield call(db.transaction, tx =>
      mod.note.restore(tx, payload))

    let map = getNotesMap({ notes: restored }, { notes: payload })

    for (let { id, type, notes } of map.values()) {
      yield put(act[type].notes.add({ id, notes }))
    }

    this.undo = act.note.delete(Object.keys(restored))

    return restored
  }
}

Restore.register(NOTE.RESTORE)
