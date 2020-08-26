import { call, select } from 'redux-saga/effects'
import { Command } from '../command'
import { SELECTION } from '../../constants'
import { pick } from '../../common/util'
import * as mod from '../../models'
import act from '../../actions/selection'


export class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { id, data } = payload

    let original = yield select(state =>
      pick(state.selections[id], Object.keys(data)))

    yield call(db.transaction, tx =>
      mod.image.save(tx, { id, timestamp: meta.now, ...data }))

    this.undo = act.save({ id, data: original })

    return { id, ...data }
  }
}

Save.register(SELECTION.SAVE)
