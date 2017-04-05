'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { get } = require('../common/util')
const mod = require('../models/item')
const act = require('../actions')
const ms = require('ms')

module.exports = {

  // eslint-disable-next-line complexity
  *search(db) {
    try {
      const { nav, metadata, items } = yield select()
      const { list, tags, trash, sort, lists } = nav

      const START = Date.now()

      let result

      switch (true) {
        case (trash):
          result = yield call(mod.trash, db, { sort })
          break

        case (list != null):
          result = yield call(mod.list, db, list, {
            tags,
            sort: get(lists, [list, 'sort']) || sort
          })

          break

        default:
          result = yield call(mod.all, db, { tags, sort })
      }

      verbose(`tags used ${tags}`)
      verbose(`*search query took ${ms(Date.now() - START)}`)

      yield put(act.qr.items.update(result))

      const missing = {
        items: [], metadata: []
      }

      for (let id of result) {
        if (!(id in items)) missing.items.push(id)
        if (!(id in metadata)) missing.metadata.push(id)
      }

      if (missing.items.length > 0) {
        yield put(act.item.load(missing.items))
      }

      if (missing.metadata.length > 0) {
        yield put(act.metadata.load(missing.metadata))
      }


    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  },


  //eslint-disable-next-line complexity
  *load() {
    try {
      const { nav, items, metadata, photos, notes } = yield select()

      const missing = {
        items: [], photos: [], metadata: [], notes: []
      }

      for (let id of nav.items) {
        const item = items[id]

        if (item) {
          if (item.pending) continue

          for (let photo of item.photos) {
            if (!(photo in metadata)) missing.metadata.push(photo)

            if (!(photo in photos)) {
              missing.photos.push(photo)

            } else {
              for (let note of photos[photo].notes) {
                //eslint-disable-next-line max-depth
                if (!(note in notes)) missing.notes.push(note)
              }
            }
          }

        } else {
          missing.items.push(id)
        }

        if (!(id in metadata)) missing.metadata.push(id)
      }

      if (missing.items.length) {
        yield put(act.item.load(missing.items, { load: true }))
      }

      if (missing.metadata.length) {
        yield put(act.metadata.load(missing.metadata))
      }

      if (missing.photos.length) {
        yield put(act.photo.load(missing.photos))
      }

      if (missing.notes.length) {
        yield put(act.note.load(missing.notes))
      }

    } catch (error) {
      warn(`unexpectedly failed in *load: ${error.message}`)
      verbose(error.stack)
    }
  }
}
