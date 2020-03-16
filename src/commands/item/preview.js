'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { win } = require('../../window')
const { darwin } = require('../../common/os')
const { get } = require('../../common/util')


class Preview extends Command {
  *exec() {
    if (!darwin) return

    let { photos } = this.action.payload
    let paths = yield select(state =>
      photos.map(id => get(state.photos, [id, 'path'])))

    if (paths.length > 0) {
      win.preview(paths[0])
    }
  }
}

Preview.register(ITEM.PREVIEW)

module.exports = {
  Preview
}
