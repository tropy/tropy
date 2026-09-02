import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { getSortColumn } from '../../selectors/index.js'
import { NAV, PHOTO } from '../../constants/index.js'

export class Order extends Command {
  *exec () {
    let { db } = this.options
    let { payload, meta } = this.action
    let { item, photos } = payload

    let original = yield select(state => {
      if (getSortColumn(state).column === NAV.COLUMN.MODIFIED.id)
        meta.search = true

      return state.items[item].photos
    })

    yield call(db.transaction, async tx => {
      await mod.photo.order(tx, item, photos)
      await mod.subject.touch(tx, { id: item, timestamp: meta.now })
    })

    this.undo = act.photo.order({ item, photos: original })

    return { id: item, photos }
  }
}

Order.register(PHOTO.ORDER)

