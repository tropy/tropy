'use strict'

const { call, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { API } = require('../../constants')
const { pluck } = require('../../common/util')
const mod = require('../../models')


class ItemFind extends Command {
  *exec() {
    let { db } = this.options
    let { list, query, sort, tags } = this.action.payload

    let qr = (list == null) ?
      yield call(mod.item.all, db, { query, sort, tags }) :
      yield call(mod.item.list, db, list, { query, sort, tags })

    let { items } = yield select()

    return pluck(items, qr.items)
  }
}

ItemFind.register(API.ITEM.FIND)


class ItemShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let item = yield select(state => state.items[id])
    return item
  }
}

ItemShow.register(API.ITEM.SHOW)

module.exports = {
  ItemFind,
  ItemShow
}
