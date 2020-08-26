import assert from 'assert'
import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import { remove } from '../../common/util'
import * as act from '../../actions'
import * as mod from '../../models'


export class Explode extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let item = yield select(state => ({
      ...state.items[payload.id]
    }))

    let photos = payload.photos || item.photos.slice(1)

    let items = {}
    let moves = {}

    if (payload.items == null) {
      yield call(db.transaction, async tx => {
        for (let photo of photos) {
          let dup = await mod.item.dup(tx, item.id)

          await mod.photo.move(tx, { ids: [photo], item: dup.id })
          moves[photo] = { item: dup.id }
          dup.photos.push(photo)

          items[dup.id] = dup
        }
      })

      yield put(act.metadata.load(Object.keys(items)))

    } else {
      items = payload.items
      let ids = Object.keys(items)

      assert(ids.length === photos.length)

      yield call(db.transaction, async tx => {
        await mod.item.restore(tx, ids)

        for (let i = 0, ii = photos.length; i < ii; ++i) {
          let pid = photos[i]
          let iid = ids[i]

          await mod.photo.move(tx, { ids: [pid], item: iid })
          moves[pid] = { item: iid }
        }
      })
    }

    yield put(act.photo.bulk.update(moves))

    this.undo = act.item.implode({
      item,
      items: Object.keys(items)
    })

    this.redo = act.item.explode({
      id: item.id,
      photos, items
    })

    this.meta = {
      inc: photos.length
    }

    return {
      ...items,
      [item.id]: {
        ...item, photos: remove(item.photos, ...photos)
      }
    }
  }
}

Explode.register(ITEM.EXPLODE)


export class Implode extends Command {
  *exec() {
    let { db } = this.options
    let { item, items } = this.action.payload
    let { id, photos } = item

    yield call(db.transaction, async tx =>
      mod.item.implode(tx, { id, photos, items }))

    yield put(act.photo.bulk.update([photos, { item: id }]))
    yield put(act.item.remove(items))
    yield put(act.item.select({ items: [id] }, { mod: 'replace' }))

    this.meta = {
      dec: items.length
    }

    return item
  }
}

Implode.register(ITEM.IMPLODE)
