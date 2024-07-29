import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import mod from '../../models/photo.js'
import { PHOTO } from '../../constants/index.js'

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
