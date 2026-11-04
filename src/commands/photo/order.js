import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'

export class Order extends Command {
  *exec () {
    let { db } = this.options
    let { payload, meta } = this.action
    let { item, photos } = payload

    // No search when sorted by modified: the order saga moves the item.
    let original = yield select(state => state.items[item].photos)

    yield call(db.transaction, async tx => {
      await mod.photo.order(tx, item, photos)
      await mod.subject.touch(tx, { id: item, timestamp: meta.now })
    })

    this.undo = act.photo.order({ item, photos: original })

    return { id: item, photos }
  }
}

Order.register(PHOTO.ORDER)

