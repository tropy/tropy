import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'


export class ItemShow extends Command {
  *exec () {
    let { id } = this.action.payload
    let item = yield select(state => state.items[id])
    return item
  }
}

ItemShow.register(API.ITEM.SHOW)
