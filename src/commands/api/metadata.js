import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'

export class MetadataShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let data = yield select(state => state.metadata[id])
    return data
  }
}

MetadataShow.register(API.METADATA.SHOW)
