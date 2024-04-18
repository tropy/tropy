import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { remove, restore } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'


function getTranscriptionsForRemoval(state, ids) {
  return ids.map(id => {
    let tr = state.transcriptions[id]
    let parent = state.selections[tr.parent] || state.photos[tr.parent]

    return {
      id,
      parent: tr.parent,
      idx: parent.transcriptions.indexOf(id)
    }
  })
}

export class Remove extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let transcriptions = yield select(getTranscriptionsForRemoval, payload)

    yield call(db.transaction, async tx => {
      await remove(tx, payload)
    })

    this.undo = slice.restore(transcriptions)
    this.redo = slice.remove(payload)

    return transcriptions
  }
}

Remove.register(slice.remove.type)


export class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let id = payload.map(tr => tr.id)

    yield call(db.transaction, async tx => {
      await restore(tx, id)
    })

    this.undo = slice.remove(id)
    this.redo = slice.restore(payload)

    return payload
  }
}

Restore.register(slice.restore.type)
