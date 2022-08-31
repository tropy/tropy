import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { pick } from '../../common/util'
import mod from '../../models/metadata'
import act from '../../actions/metadata'
import { getSortColumn } from '../../selectors'
import { METADATA, TYPE } from '../../constants'


export class Save extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { ids, data } = payload

    this.original = {}

    yield select(state => {
      let sort = getSortColumn(state)

      if (sort.column in data)
        meta.search = true

      let props = Object.keys(data)

      for (let id of ids) {
        this.original[id] = pick(state.metadata[id], props, {}, true)
      }
    })

    for (let prop in data) {
      if (typeof data[prop] === 'string')
        data[prop] = { text: data[prop], type: TYPE.TEXT }
    }

    yield put(act.update({ ids, data }))

    yield call(db.transaction, tx =>
      mod.update(tx, {
        id: ids,
        data,
        timestamp: meta.now
      }))

    this.undo = act.restore(this.original)

    return ids
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
  }
}

Save.register(METADATA.SAVE)


export class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action

    let ids = Object.keys(payload)
    this.original = {}

    yield select(({ metadata }) => {
      for (let id of ids) {
        this.original[id] = pick(
          metadata[id],
          Object.keys(payload[id]),
          {},
          true)
      }
    })

    yield put(act.merge(payload))

    yield call(db.transaction, async tx => {
      for (let id of ids) {
        await mod.update(tx, {
          id,
          data: payload[id],
          timestamp: meta.now
        })
      }
    })

    this.undo = act.restore(this.original)

    return ids
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
  }
}

Restore.register(METADATA.RESTORE)
