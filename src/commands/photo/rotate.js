import { call, put } from 'redux-saga/effects'
import { Command } from '../command'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'

export class Rotate extends Command {
  *exec() {
    let { db } = this.options
    let { id, by, type = 'photo' } = this.action.payload

    let photos = yield call(mod.image.rotate, db, { id, by })
    yield put(act[type].bulk.update(photos))

    this.undo = act.photo.rotate({ id, by: -by, type })

    return photos
  }
}

Rotate.register(PHOTO.ROTATE)
