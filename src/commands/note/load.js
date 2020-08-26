import { call } from 'redux-saga/effects'
import { Command } from '../command'
import mod from '../../models/note'
import { NOTE } from '../../constants'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let notes = yield call(mod.load, db, payload)

    return notes
  }
}

Load.register(NOTE.LOAD)
