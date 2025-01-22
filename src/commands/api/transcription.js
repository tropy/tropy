import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { Document } from 'alto-xml'
import { API } from '../../constants/index.js'

import { create } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'


export class TranscriptionCreate extends Command {
  *exec() {
    let { db } = this.options
    let { data, text, angle, mirror, photo, selection } = this.action.payload

    if (photo == null) {
      ({ photo, selection } = yield select(state => state.nav))
    }

    if (data != null) {
      text = Document.parse(data).toPlainText()
    }

    let parents = Array.isArray(photo) ?
      photo : [selection || photo]

    let transcriptions = yield call(db.transaction, async tx =>
      Promise.all(parents.map(parent =>
        create(tx, { angle, mirror, data, parent, text }))))

    this.undo = slice.remove(
      transcriptions.map(tr => tr.id))

    this.redo = slice.restore(
      transcriptions.map(({ id, parent }) =>
        ({ id, parent, idx: -1 })))

    return transcriptions.reduce((acc, tr) => (acc[tr.id] = tr, acc), {})
  }
}

TranscriptionCreate.register(API.TRANSCRIPTION.CREATE)


export class TranscriptionShow extends Command {
  *exec() {
    let { id, format } = this.action.payload

    let transcription = yield select(state => state.transcriptions[id])

    if (transcription == null)
      return null

    switch (format) {
      case 'plain':
      case 'text':
        return transcription.text
      case 'alto':
      case 'xml':
        return transcription.data
      default:
        return transcription
    }
  }
}

TranscriptionShow.register(API.TRANSCRIPTION.SHOW)
