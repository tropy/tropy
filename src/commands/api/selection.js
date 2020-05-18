'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('../command')
const { API } = require('../../constants')

class SelectionShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let selection = yield select(state => state.selections[id])
    return selection
  }
}

SelectionShow.register(API.SELECTION.SHOW)


module.exports = {
  SelectionShow
}
