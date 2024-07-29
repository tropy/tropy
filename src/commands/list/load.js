import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import { LIST } from '../../constants/index.js'
import mod from '../../models/list.js'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    return (yield call(mod.all, db))
  }
}

Load.register(LIST.LOAD)

