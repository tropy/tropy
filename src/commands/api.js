'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { pluck } = require('../common/util')
const { serialize } = require('../export/note')
//const act = require('../actions')
//const mod = require('../models')


class ItemFind extends Command {
  static get ACTION() {
    return API.ITEM.FIND
  }

  *exec() {
  }
}

class ItemShow extends Command {
  static get ACTION() {
    return API.ITEM.SHOW
  }

  *exec() {
    let { id } = this.action.payload
    let item = yield select(state => state.items[id])
    return item
  }
}

class NoteShow extends Command {
  static get ACTION() {
    return API.NOTE.SHOW
  }

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

class PhotoFind extends Command {
  static get ACTION() {
    return API.PHOTO.FIND
  }

  *exec() {
    let { item } = this.action.payload
    let { items, photos } = yield select()

    if (!(item in items))
      return null

    return pluck(photos, items[item].photos)
  }
}

class PhotoShow extends Command {
  static get ACTION() {
    return API.PHOTO.SHOW
  }

  *exec() {
    let { id } = this.action.payload
    let photo = yield select(state => state.photos[id])
    return photo
  }
}

class SelectionShow extends Command {
  static get ACTION() {
    return API.SELECTION.SHOW
  }

  *exec() {
    let { id } = this.action.payload
    let selection = yield select(state => state.selections[id])
    return selection
  }
}


module.exports = {
  ItemFind,
  ItemShow,
  NoteShow,
  PhotoFind,
  PhotoShow,
  SelectionShow
}
