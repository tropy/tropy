'use strict'

const { call } = require('redux-saga/effects')
const { Command } = require('./command')
const dialog = require('../dialog')
const { PHOTO } = require('../constants')

class Create extends Command {
  static get action() { return PHOTO.CREATE }

  *exec() {
    //const { db } = this.options
    yield call(dialog.save)
  }
}

module.exports = {
  Create
}
