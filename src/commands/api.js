'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')
const { pick } = require('../common/util')
//const act = require('../actions')
//const mod = require('../models')


class Find extends Command {
  static get ACTION() {
    return API.ITEM.FIND
  }

  *exec() {
  }
}

class Show extends Command {
  static get ACTION() {
    return API.ITEM.SHOW
  }

  *exec() {
    let { id } = this.action.payload

    let [item, data] = yield select(state => ([
      state.items[id],
      state.metadata[id]
    ]))

    if (item == null)
      return  null

    let photos = yield select(state =>
      pick(state.photos, item.photos))

    return { ...item, data, photos }
  }
}

module.exports = {
  Find,
  Show
}
