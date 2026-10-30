import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { array } from '../../common/util.js'

export class Rotate extends Command {
  *exec () {
    let { db } = this.options
    let { by, type = 'photo' } = this.action.payload

    // Photos and selections share ids: rotate only images of this type.
    let id = yield select(state =>
      array(this.action.payload.id).filter(i => i in state[`${type}s`]))

    if (id.length === 0)
      return null

    let photos = yield call(mod.image.rotate, db, { id, by })
    yield put(act[type].bulk.update(photos))

    this.undo = act.photo.rotate({ id, by: -by, type })

    return photos
  }
}

Rotate.register(PHOTO.ROTATE)
