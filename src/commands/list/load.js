import { call } from 'redux-saga/effects'
import { Command } from '../command'
import { LIST } from '../../constants'
import mod from '../../models/list'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    return (yield call(mod.all, db))
  }
}

Load.register(LIST.LOAD)

