import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import mod from '../../models/metadata.js'
import { METADATA } from '../../constants/index.js'


export class Load extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const data = yield call(mod.load, db, payload)
    return data
  }
}

Load.register(METADATA.LOAD)
