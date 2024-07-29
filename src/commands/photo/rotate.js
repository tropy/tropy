import { call, put } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'

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
