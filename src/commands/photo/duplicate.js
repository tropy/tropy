import assert from 'assert'
import { all, call, put, select } from 'redux-saga/effects'
import { ImportCommand } from '../import'
import { fail } from '../../dialog'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'
import { Image } from '../../image'
import {  warn } from '../../common/log'
import { blank, pluck, splice } from '../../common/util'


export class Duplicate extends ImportCommand {
  *exec() {
    let { cache, db } = this.options
    let { payload } = this.action
    let { item } = payload

    assert(!blank(payload.photos), 'missing photos')

    let [base, order, originals, data, settings] = yield select(state => [
      state.project.basePath,
      state.items[item].photos,
      pluck(state.photos, payload.photos),
      pluck(state.metadata, payload.photos),
      state.settings
    ])

    let idx = [order.indexOf(payload.photos[0]) + 1]
    let total = originals.length
    let photos = []

    for (let i = 0; i < total; ++i) {
      let { density, template, path, page, protocol } = originals[i]

      try {
        let image = yield call([Image, Image.open], {
          density: density || settings.density,
          path,
          page,
          protocol
        })

        let photo = yield call(db.transaction, tx =>
          mod.photo.create(tx, { base, template }, {
            item,
            image: image.toJSON(),
            data: data[i]
          }))

        yield put(act.metadata.load([photo.id]))

        yield all([
          put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        photos.push(photo.id)
        yield call(cache.consolidate, photo.id, image)

      } catch (e) {
        warn({ stack: e.stack }, `failed to duplicate "${path}"`)
        fail(e, this.action.type)
      }
    }

    yield call(mod.photo.order, db, item, splice(order, idx[0], 0, ...photos))
    yield put(act.item.photos.add({ id: item, photos }, { idx }))

    this.undo = act.photo.delete({ item, photos })
    this.redo = act.photo.restore({ item, photos }, { idx })

    return photos
  }
}

Duplicate.register(PHOTO.DUPLICATE)
