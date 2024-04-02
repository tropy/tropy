import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import { load } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'

export class Load extends Command {
  *exec() {
    let { db } = this.options
    let id = this.action.payload
    return yield call(load, db, id)
  }
}

Load.register(slice.load.type)
