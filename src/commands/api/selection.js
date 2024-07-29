import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'

export class SelectionShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let selection = yield select(state => state.selections[id])
    return selection
  }
}

SelectionShow.register(API.SELECTION.SHOW)
