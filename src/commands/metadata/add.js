import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { pick } from '../../common/util'
import { text } from '../../value'
import mod from '../../models/metadata'
import * as act from '../../actions'
import { METADATA } from '../../constants'


export class Add extends Command {
  *exec() {
    let { payload } = this.action
    let { id, property, value } = payload

    if (value == null) value = text('')

    yield put(act.metadata.update({
      ids: id, data: { [property]: value }
    }))

    yield put(act.edit.start({ field: { id, property } }))

    this.undo = act.metadata.delete({ id, property })
  }
}

Add.register(METADATA.ADD)


export class Delete extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { id, property } = payload

    let original = {}

    yield select(({ metadata }) => {
      for (let x of id) {
        original[x] = pick(metadata[x], [property], {}, true)
      }
    })

    yield call(mod.remove, db, { id, property })
    yield put(act.metadata.remove([id, property]))

    this.undo = act.metadata.restore(original)
  }
}

Delete.register(METADATA.DELETE)
