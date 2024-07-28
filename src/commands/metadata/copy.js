import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { pick } from '../../common/util.js'
import mod from '../../models/metadata.js'
import act from '../../actions/metadata.js'
import { METADATA } from '../../constants/index.js'


export class Copy extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action

    let data = yield this.fetch()

    yield put(act.merge(data))

    yield call(db.transaction, async tx => {
      for (let id of payload.id) {
        await mod.update(tx, {
          id,
          data: data[id],
          timestamp: meta.now
        })
      }
    })

    return payload
  }

  *fetch() {
    let { payload, meta } = this.action
    let { from, to } = payload

    let copy = {}
    let data = {}

    yield select(({ metadata }) => {
      let props = meta.cut ? [from, to] : [to]

      for (let id of payload.id) {
        let md = metadata[id] || {}

        copy[id] = pick(md, props, {}, true)
        data[id] = { [to]: md[from] }

        if (meta.cut) {
          data[id][from] = null
        }
      }
    })

    this.undo = act.restore(copy)
    this.original = copy

    return data
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
  }
}

Copy.register(METADATA.COPY)
