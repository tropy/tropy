import assert from 'node:assert'
import { all, call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { fail } from '../../dialog.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { warn } from '../../common/log.js'
import { blank, splice } from '../../common/util.js'


export class Duplicate extends Command {
  *exec () {
    let { db } = this.options
    let { meta, payload } = this.action
    let { item } = payload
    let { deep = true } = meta

    assert(!blank(payload.photos), 'missing photos')

    let [basePath, order] = yield select(state => [
      state.project.basePath,
      state.items[item].photos
    ])

    let idx = [order.indexOf(payload.photos[0]) + 1]
    let total = payload.photos.length
    let photos = []

    for (let i = 0; i < total; ++i) {
      let source = payload.photos[i]

      try {
        let { photo, notes, selections, transcriptions } = yield call(
          db.transaction, tx =>
            mod.photo.dup(tx, source, { basePath, deep }))

        yield put(act.metadata.load([
          photo.id,
          ...selections.map(s => s.id)
        ]))

        yield all([
          put(act.note.insert(notes)),
          put(act.transcriptions.insert(transcriptions)),
          put(act.selection.insert(selections)),
          put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        photos.push(photo.id)

      } catch (err) {
        warn({ err }, `failed to duplicate photo ${source}`)
        fail(err, this.action.type)
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
