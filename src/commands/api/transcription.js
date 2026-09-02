import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'

import { getItemTranscriptions } from '../../selectors/transcriptions.js'


export class TranscriptionFind extends Command {
  *exec () {
    let { id, format, separator = '\n' } = this.action.payload

    let transcriptions = yield select(state =>
      getItemTranscriptions(state, { id }))

    switch (format) {
      case 'plain':
      case 'text':
      case 'html':
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
