'use strict'

const { all, call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { pluck } = require('../../common/util')
const act = require('../../actions')
const mod = require('../../models')


class Merge extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let [[item, ...items], metadata] = yield select(state => [
      pluck(state.items, payload),
      state.metadata
    ])

    let { id, ...data } = metadata[item.id]

    let m = yield call(db.transaction, tx =>
      mod.item.merge(tx, item, items, metadata))

    yield all([
      put(act.photo.bulk.update([m.photos, { item: id }])),
      put(act.metadata.insert({ id, ...m.data })),
      put(act.item.select({ items: [id] }, { mod: 'replace' }))
    ])


    this.undo = act.item.split({ ...m, item, items, data })
    this.meta = { dec: items.length }

    return {
      ...item,
      photos: [...item.photos, ...m.photos],
      tags: [...item.tags, ...m.tags]
    }
  }
}

Merge.register(ITEM.MERGE)


class Split extends Command {
  *exec() {
    let { db } = this.options
    let { item, items, data, lists, tags } = this.action.payload
    let photos = this.getPhotoData(items)

    yield call(db.transaction, tx =>
      mod.item.split(tx, item.id, items, data, lists, tags))

    yield all([
      put(act.photo.update(photos)),
      put(act.metadata.insert({ id: item.id, ...data }))
    ])

    this.undo = act.item.merge([item.id, ...items.map(i => i.id)])
    this.meta = { inc: items.length }

    return item
  }

  getPhotoData(items) {
    let photos = []
    for (let item of items) {
      for (let photo of item.photos) {
        photos.push({
          id: photo,
          item: item.id
        })
      }
    }
    return photos
  }
}

Split.register(ITEM.SPLIT)


module.exports = {
  Merge,
  Split
}
