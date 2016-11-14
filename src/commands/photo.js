'use strict'

const { call, put } = require('redux-saga/effects')
const { Command } = require('./command')
const dialog = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')
const { Image } = require('../common/image')

class Create extends Command {
  static get action() { return PHOTO.CREATE }

  *exec() {
    const { db } = this.options
    let { item, files } = this.action.payload

    if (!files) files = yield call(dialog.images)
    if (!files || !files.length) return

    // Ignore time spent in open dialog
    this.init = performance.now()

    const photos = []

    // TODO Improve handling of multiple photos!
    for (let file of files) {
      const image = yield call(Image.read, file)

      const photo = yield call([db, db.transaction], tx => (
        mod.photo.create(tx, { item, image })
        // TODO set title
      ))

      photos.push(photo.id)
    }

    yield put(act.photo.load([item])) // TODO use photo ids!
    yield put(act.item.photos.add(photos))

    this.undo(act.photo.delete(photos))

    return photos
  }
}


class Load extends Command {
  static get action() { return PHOTO.LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const photos = yield call(mod.photo.load, db, ids)

    return photos
  }
}

module.exports = {
  Create,
  Load
}
