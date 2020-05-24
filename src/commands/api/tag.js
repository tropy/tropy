'use strict'

const { select } = require('redux-saga/effects')
const { Command } = require('../command')
const { API } = require('../../constants')
const { pluck } = require('../../common/util')

const {
  findTag,
  getAllTags
} = require('../../selectors')


class TagShow extends Command {
  *exec() {
    let { payload } = this.action
    let tag = yield select(state => findTag(state, payload))
    return tag
  }
}

TagShow.register(API.TAG.SHOW)


class TagFind extends Command {
  *exec() {
    let { id, reverse } = this.action.payload

    let tags = (id == null) ?
      yield select(getAllTags) :
      yield select(state =>
        (id in state.items) ?
          pluck(state.tags, state.items[id].tags) :
          null)

    if (tags == null)
      return null
    if (reverse)
      return tags.reverse()
    else
      return tags
  }
}

TagFind.register(API.TAG.FIND)


module.exports = {
  TagFind,
  TagShow
}
