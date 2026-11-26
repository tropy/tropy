import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'

import { selectItemTranscriptions } from '../../slices/transcriptions.js'


export class TranscriptionFind extends Command {
  *exec () {
    let { id, format, separator = '\n' } = this.action.payload

    let transcriptions = yield select(selectItemTranscriptions, id)

    if (transcriptions == null)
      return null

    switch (format) {
      case 'text':
        return transcriptions.map(t => t.text).join(separator + '\n')
      default:
        return transcriptions
    }
  }
}

TranscriptionFind.register(API.TRANSCRIPTION.FIND)

export class TranscriptionShow extends Command {
  *exec () {
    let { id, format } = this.action.payload

    let transcription = yield select(state => state.transcriptions[id])

    if (transcription == null)
      return null

    switch (format) {
      case 'text':
        return transcription.text
      case 'alto':
        return transcription.data
      default:
        return transcription
    }
  }
}

TranscriptionShow.register(API.TRANSCRIPTION.SHOW)
