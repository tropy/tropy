'use strict'

const { Command } = require('../command')
const { call, select } = require('redux-saga/effects')
const { PHOTO } = require('../../constants')
const { Cache } = require('../../common/cache')
const { Esper } = require('../../esper')
const sharp = require('sharp')


class Extract extends Command {
  *exec() {
    let { cache } = this.options
    let { id } = this.action.payload

    let photo = yield select(state => state.photos[id])
    let src = Cache.url(cache, 'full', photo)

    // TODO orientation

    let rgba = yield call(Esper.instance.extract, src, photo)

    let image = sharp(Buffer.from(rgba), {
      raw: {
        channels: 4,
        width: photo.width,
        height: photo.height
      }
    })

    yield call([image, image.toFile], '/Users/dupin/Desktop/out.jpg')
  }
}

Extract.register(PHOTO.EXTRACT)

module.exports = {
  Extract
}
