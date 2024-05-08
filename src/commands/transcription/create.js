import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { create } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'

export class Create extends Command {
  *exec() {
    let { db } = this.options
    let { config, data, text, photo, selection } = this.action.payload
    let { plugin } = this.action.meta

    if (photo == null) {
      ({ photo, selection } = yield select(state => state.nav))
    }

    if (config == null) {
      config = { plugin }
    }

    // TODO sync/convert data and text if given

    let parents = Array.isArray(photo) ?
      photo : [selection || photo]

    let transcriptions = yield call(db.transaction, async tx =>
      Promise.all(parents.map(parent =>
        create(tx, { config, data, parent, text }))))

    this.undo = slice.remove(
      transcriptions.map(tr => tr.id))

    this.redo = slice.restore(
      transcriptions.map(({ id, parent }) =>
        ({ id, parent, idx: -1 })))

    return transcriptions.reduce((acc, tr) => (acc[tr.id] = tr, acc), {})
  }
}

Create.register(slice.create.type)
