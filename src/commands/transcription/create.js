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

    let transcription = yield call(db.transaction, tx =>
      create(tx, {
        config,
        data,
        parent: selection || photo,
        text
      }))

    let { id, parent } = transcription

    this.undo = slice.remove([id])
    this.redo = slice.restore([{ id, parent, idx: -1 }])

    return { [id]: transcription }
  }
}

Create.register(slice.create.type)
