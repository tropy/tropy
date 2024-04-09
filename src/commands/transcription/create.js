import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { create } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'

export class Create extends Command {
  *exec() {
    let { db } = this.options
    let { config, data, text, photo, selection } = this.action.payload

    if (photo == null) {
      ({ photo, selection } = yield select(state => state.nav))
    }

    // TODO sync/convert data and text if given

    let tr = yield call(db.transaction, tx =>
      create(tx, {
        config,
        data,
        parent: selection || photo,
        text
      }))

    // TODO add transcription in photo/selection reducer!

    this.undo = slice.remove([tr.id])
    this.redo = slice.restore([tr.id])

    return { [tr.id]: tr }
  }
}

Create.register(slice.create.type)
