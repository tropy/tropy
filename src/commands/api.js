'use strict'

const { call, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { pluck } = require('../common/util')
const { serialize } = require('../components/editor/serialize')
//const act = require('../actions')
const mod = require('../models')

const {
  findTag,
  getAllTags
} = require('../selectors')


class ItemFind extends Command {
  *exec() {
    let { db } = this.options
    let { list, query, sort, tags } = this.action.payload

    let qr = (list == null) ?
      yield call(mod.item.all, db, { query, sort, tags }) :
      yield call(mod.item.list, db, list, { query, sort, tags })

    let { items } = yield select()

    return pluck(items, qr.items)
  }
}

ItemFind.register(API.ITEM.FIND)


class ItemShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let item = yield select(state => state.items[id])
    return item
  }
}

ItemShow.register(API.ITEM.SHOW)


class MetadataShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let data = yield select(state => state.metadata[id])
    return data
  }
}

MetadataShow.register(API.METADATA.SHOW)


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


class PhotoFind extends Command {
  *exec() {
    let { item } = this.action.payload
    let { items, photos } = yield select()

    if (!(item in items))
      return null

    return pluck(photos, items[item].photos)
  }
}

PhotoFind.register(API.PHOTO.FIND)


class PhotoShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let photo = yield select(state => state.photos[id])
    return photo
  }
}

PhotoShow.register(API.PHOTO.SHOW)


class TagShow extends Command {
  *exec() {
    let { payload } = this.action
    let tag = yield select(state => findTag(state, payload))
    return tag
  }
}

TagShow.register(API.TAG.SHOW)


class TagFind extends Command {
  *exec() {
    let { id, reverse } = this.action.payload

    let tags = (id == null) ?
      yield select(getAllTags) :
      yield select(state =>
        (id in state.items) ?
          pluck(state.tags, state.items[id].tags) :
          null)

    if (tags == null)
      return null
    if (reverse)
      return tags.reverse()
    else
      return tags
  }
}

TagFind.register(API.TAG.FIND)


class SelectionShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let selection = yield select(state => state.selections[id])
    return selection
  }
}

SelectionShow.register(API.SELECTION.SHOW)


module.exports = {
  ItemFind,
  ItemShow,
  MetadataShow,
  NoteShow,
  PhotoFind,
  PhotoShow,
  TagFind,
  TagShow,
  SelectionShow
}
