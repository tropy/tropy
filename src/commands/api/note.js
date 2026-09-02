import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'
import { serialize } from '../../editor/serialize.js'
import { pick } from '../../common/util.js'


export class NoteShow extends Command {
  *exec () {
    let { id, format } = this.action.payload

    let note = yield select(state => state.notes[id])

    if (note == null)
      return null

    switch (format) {
      case 'html':
        return serialize(note, { format: { html: true }, localize: false }).html
      case 'plain':
      case 'text':
        return note.text
      case 'md':
      case 'markdown':
        return serialize(note, {
          format: { markdown: true },
          localize: false
        }).markdown
      default:
        return pick(note, [
          'id',
          'photo',
          'selection',
          'text',
          'language',
          'created',
          'modified'
        ])
    }
  }
}

NoteShow.register(API.NOTE.SHOW)
