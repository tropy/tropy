import { call } from 'redux-saga/effects'
import { Command } from '../command'
import { SELECTION } from '../../constants'
import mod from '../../models/selection'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let selections = yield call(db.seq, conn =>
      mod.load(conn, payload))

    return selections
  }
}

Load.register(SELECTION.LOAD)
