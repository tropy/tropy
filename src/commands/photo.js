'use strict'

const { call, put } = require('redux-saga/effects')
const { Command } = require('./command')
const dialog = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')

class Create extends Command {
  static get action() { return PHOTO.CREATE }

  *exec() {
    const { db } = this.options
    let { item, files } = this.action.payload

    if (!files) files = yield call(dialog.images)
    if (!files || !files.length) return

    const photo = yield call(mod.photo.create, db, { item, path: files[0] })
    yield put(act.item.photos.add(photo))

    return photo
  }
}

module.exports = {
  Create
}
