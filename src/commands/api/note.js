'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { serialize } = require('../components/editor/serialize')


class NoteShow extends Command {
  *exec() {
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
        return note
    }
  }
}

NoteShow.register(API.NOTE.SHOW)

module.exports = {
  NoteShow
}
