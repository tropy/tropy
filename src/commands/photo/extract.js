'use strict'

const { Command } = require('../command')
const { call, select } = require('redux-saga/effects')
const { PHOTO } = require('../../constants')
const { Cache } = require('../../common/cache')
const { Rotation } = require('../../common/iiif')
const { Esper } = require('../../esper')
const sharp = require('sharp')


class Extract extends Command {
  *exec() {
    let { cache } = this.options
    let { payload } = this.action

    let [photo, selection] = yield select(state => ([
      state.photos[payload.id],
      state.selections[payload.selection]
    ]))

    let image = selection || photo
    let src = Cache.url(cache, 'full', photo)

    let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
      ...image,
      ...Rotation.addExifOrientation(image, photo).toJSON()
    })

    let out = sharp(buffer, { raw })

    yield call([out, out.toFile], '/Users/dupin/Desktop/out.jpg')
  }
}

Extract.register(PHOTO.EXTRACT)

module.exports = {
  Extract
}
