'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { pluck } = require('../common/util')


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
  PhotoFind,
  PhotoShow
}
