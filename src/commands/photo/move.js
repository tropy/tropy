import { all, call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { splice } from '../../common/util.js'
import { selectPhotoCursor } from '../../slices/nav/cursor.js'


export class Move extends Command {
  *exec () {
    let { db } = this.options
    let { photos, item } = this.action.payload

    let { idx } = this.action.meta
    let { cursor, order, original, selections } = yield select(state => ({
      cursor: selectPhotoCursor(state),
      order: state.items[item].photos,
      selections: photos.flatMap(({ id }) =>
        state.photos[id]?.selections ?? []),

      // Assuming all photos being moved from the same item!
      original: state.items[photos[0].item]
    }))

    const ids = photos.map(photo => photo.id)

    idx = (idx == null || idx < 0) ? order.length : idx
    order = splice(order, idx, 0, ...ids)

    yield call([db, db.transaction], async tx => {
      await mod.photo.move(tx, { item, ids })
      await mod.photo.order(tx, item, order)
    })

    // The photo shown leaves its item: show its neighbor.
    if (ids.includes(cursor)) {
      let rest = original.photos.filter(id => !ids.includes(id))
      let at = original.photos.indexOf(cursor)

      yield put(act.photo.select({
        item: original.id,
        photo: rest[at] ?? rest.at(-1)
      }))
    }

    yield all([
      put(act.photo.bulk.update([ids, { item }])),
      put(act.item.photos.remove({ id: original.id, photos: ids, selections })),
      put(act.item.photos.add({ id: item, photos: ids }, { idx }))
    ])

    this.undo = act.photo.move({
      photos: photos.map(({ id }) => ({ id, item })),
      item: original.id
    }, {
      // Restores all photos at the original position of the first
      // of the moved photos. Adjust if we want to support moving
      // arbitrary selections!
      idx: original.photos.indexOf(ids[0])
    })
  }
}

Move.register(PHOTO.MOVE)
