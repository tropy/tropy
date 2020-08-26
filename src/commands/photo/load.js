import { call, select } from 'redux-saga/effects'
import { Command } from '../command'
import mod from '../../models/photo'
import { PHOTO } from '../../constants'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { project } = yield select()

    let photos = yield call(db.seq, conn =>
      mod.load(conn, payload, project))

    return photos
  }
}

Load.register(PHOTO.LOAD)
