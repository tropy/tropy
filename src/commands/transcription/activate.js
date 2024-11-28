import { call } from 'redux-saga/effects'
import { Command } from '../command.js'
import { touch } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'

export class Activate extends Command {
  *exec() {
    let { db } = this.options
    let id = this.action.payload
    return yield call(touch, db, id)
  }
}

Activate.register(slice.activate.type)
