import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { pick } from '../../common/util.js'


export class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { id, data } = payload

    let [original, project] = yield select(state => [
      pick(state.photos[id], Object.keys(data)),
      state.project
    ])

    const params = { id, timestamp: meta.now, ...data }

    yield call(db.transaction, async tx => {
      await mod.photo.save(tx, params, project)
      await mod.image.save(tx, params)
    })

    this.undo = act.photo.save({ id, data: original })

    if (data.density) {
      this.after = act.photo.consolidate(id, { force: true })
    }

    return { id, ...data }
  }
}

Save.register(PHOTO.SAVE)
