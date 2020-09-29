import { call } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import * as mod from '../../models'


export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let items = yield call(db.seq, conn =>
      mod.item.load(conn, payload))

    return items
  }
}

Load.register(ITEM.LOAD)
