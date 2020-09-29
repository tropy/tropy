import { select } from 'redux-saga/effects'
import { Command } from '../command'
import { API } from '../../constants'

export class MetadataShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let data = yield select(state => state.metadata[id])
    return data
  }
}

MetadataShow.register(API.METADATA.SHOW)
