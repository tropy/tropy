'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('./command')
const { API } = require('../constants')

class MetadataShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let data = yield select(state => state.metadata[id])
    return data
  }
}

MetadataShow.register(API.METADATA.SHOW)

module.exports = {
  MetadataShow
}
