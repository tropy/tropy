import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { SELECTION } from '../../constants/index.js'
import mod from '../../models/selection.js'
import * as act from '../../actions/index.js'

export class Order extends Command {
  *exec() {
    let { db } = this.options
    let { photo, selections } = this.action.payload

    let cur = yield select(({ photos }) => photos[photo].selections)

    yield call(mod.order, db, photo, selections)
    yield put(act.photo.update({ id: photo, selections }))

    this.undo = act.selection.order({ photo, selections: cur })
  }
}

Order.register(SELECTION.ORDER)
