import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import { SELECTION } from '../../constants/index.js'
import mod from '../../models/selection.js'

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
