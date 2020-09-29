import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'

export class Order extends Command {
  *exec() {
    let { db } = this.options
    let { item, photos } = this.action.payload

    let original = yield select(state => state.items[item].photos)

    yield call(mod.photo.order, db, item, photos)
    yield put(act.item.update({ id: item, photos }))

    this.undo = act.photo.order({ item, photos: original })
  }
}

Order.register(PHOTO.ORDER)

