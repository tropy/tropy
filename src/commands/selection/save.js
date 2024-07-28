import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { SELECTION } from '../../constants/index.js'
import { pick } from '../../common/util.js'
import * as mod from '../../models/index.js'
import act from '../../actions/selection.js'


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
