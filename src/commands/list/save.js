import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { LIST } from '../../constants'
import act from '../../actions/list'
import mod from '../../models/list'

export class Save extends Command {
  *exec() {
    let { payload } = this.action
    let { db } = this.options

    this.original = yield select(state => state.lists[payload.id])

    yield put(act.update(payload))
    yield call(mod.save, db, payload)

    this.undo = act.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.update(this.original))
    }
  }
}

Save.register(LIST.SAVE)
