'use strict'

const { Command } = require('../command')
const { call, select } = require('redux-saga/effects')
const { PHOTO } = require('../../constants')
const { Cache } = require('../../common/cache')
const { Rotation } = require('../../common/iiif')
const { warn, info } = require('../../common/log')
const { blank } = require('../../common/util')
const { Esper } = require('../../esper')
const dialog = require('../../dialog')
const sharp = require('sharp')


class Extract extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let { payload } = this.action

      var file = yield call(dialog.save.image)

      if (blank(file)) return

      let [photo, selection] = yield select(state => ([
        state.photos[payload.id],
        state.selections[payload.selection]
      ]))

      var image = selection || photo
      let src = Cache.url(cache, 'full', photo)

      let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
        ...image,
        ...Rotation.addExifOrientation(image, photo).toJSON()
      })

      let out = sharp(buffer, { raw })

      yield call([out, out.toFile], file)
      info(`saved image #${image.id} as ${file}`)

      return {
        file,
        size: buffer.length
      }

    } catch (e) {
      warn({ stack: e.stack }, `failed to save image #${image.id} as ${file}`)
      dialog.fail(e, this.action.type)
    }
  }
}

Extract.register(PHOTO.EXTRACT)

module.exports = {
  Extract
}
