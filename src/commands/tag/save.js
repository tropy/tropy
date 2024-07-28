import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { TAG } from '../../constants/index.js'
import { pick } from '../../common/util.js'
import mod from '../../models/tag.js'
import act from '../../actions/tag.js'


export class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    this.original = yield select(state =>
      pick(state.tags[payload.id], Object.keys(payload)))

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

Save.register(TAG.SAVE)
