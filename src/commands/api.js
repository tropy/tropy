'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { pluck } = require('../common/util')
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

    let { items, metadata, photos, notes } = yield select()

    if (!(id in items))
      return  null

    return {
      ...items[id],
      data: metadata[id],
      photos: pluck(photos, items[id].photos).map(photo => ({
        ...photo,
        notes: pluck(notes, photo.notes)
      }))
    }
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
  PhotoShow,
  SelectionShow
}
