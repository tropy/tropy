'use strict'

const { call, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { API } = require('../../constants')
const { Cache } = require('../../common/cache')
const { Rotation } = require('../../common/iiif')
const { pluck } = require('../../common/util')
const { Esper } = require('../../esper')
const sharp = require('sharp')


class PhotoExtract extends Command {
  *exec() {
    let { cache } = this.options
    let { payload } = this.action

    let { photos, selections } = yield select()
    let photo, selection

    if (payload.selection) {
      selection = selections[payload.selection]
      if (selection == null) return
      photo = photos[selection.photo]

    } else {
      photo = photos[payload.photo]
    }

    if (photo == null) return

    var image = selection || photo
    let src = Cache.url(cache, 'full', photo)

    let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
      ...image,
      ...Rotation.addExifOrientation(image, photo).toJSON()
    })

    let format = payload.format || 'png'
    let out = sharp(buffer, { raw }).toFormat(format)

    let data = yield call([out, out.toBuffer])

    return {
      data,
      format
    }
  }
}

PhotoExtract.register(API.PHOTO.EXTRACT)


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


module.exports = {
  PhotoExtract,
  PhotoFind,
  PhotoShow
}
