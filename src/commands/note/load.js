import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import mod from '../../models/note.js'
import { NOTE } from '../../constants/index.js'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let notes = yield call(mod.load, db, payload)

    return notes
  }
}

Load.register(NOTE.LOAD)
