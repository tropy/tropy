import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import * as mod from '../../models'
import * as act from '../../actions'
import { NOTE } from '../../constants'
import { getSelectableNoteId } from '../../selectors'


export class Create extends Command {
  *exec() {
    let { db } = this.options
    let { state, text } = this.action.payload

    let { photo, selection } = yield select(({ nav }) => nav)

    let type = (selection != null) ? 'selection' : 'photo'
    let id = (selection != null) ? selection : photo

    let note = yield call(db.transaction, tx =>
      mod.note.create(tx, { id, state, text }))

    yield put(act[type].notes.add({ id, notes: [note.id] }))
    yield put(act.note.select({ note: note.id, photo, selection }))

    this.undo = act.note.delete({ photo, selection, notes: [note.id] })
    this.redo = act.note.restore({ photo, selection, notes: [note.id] })

    return { [note.id]: note }
  }
}

Create.register(NOTE.CREATE)


export class Delete extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { photo, selection, notes } = payload

    let type = (selection != null) ? 'selection' : 'photo'
    let id = (selection != null) ? selection : photo

    // TODO
    // clear the selection in the nav reducer if necessary
    // to select a different note should happen in the note list component

    let [isSelected, nextId] = yield select(state => [
      state.nav.note === notes[0], getSelectableNoteId(state)
    ])

    yield call(db.transaction, tx => mod.note.delete(tx, notes))

    if (isSelected) {
      yield put(act.note.select({ photo, selection, note: nextId }))
    }

    yield put(act[type].notes.remove({ id, notes }))

    this.undo = act.note.restore(payload)

    return payload
  }
}

Delete.register(NOTE.DELETE)


export class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { photo, selection, notes } = payload

    let type = (selection != null) ? 'selection' : 'photo'
    let id = (selection != null) ? selection : photo

    let restored = yield call(db.transaction, tx =>
      mod.note.restore(tx, notes))

    yield put(act[type].notes.add({
      id,
      notes
    }))

    this.undo = act.note.delete(payload)

    return restored
  }
}

Restore.register(NOTE.RESTORE)
