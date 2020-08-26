import { call } from 'redux-saga/effects'
import { Command } from '../command'
import { TAG } from '../../constants'
import mod from '../../models/tag'


export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let tags = yield call(mod.load, db, payload)

    return tags
  }
}

Load.register(TAG.LOAD)

