import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'

function *flatten(children, lists, expand) {
  for (let id of children) {
    let list = lists[id]
    yield list
    if (expand) {
      yield * flatten(list.children, lists)
    }
  }
}

export class ListShow extends Command {
  *exec() {
    let { id, expand } = this.action.payload
    let lists = yield select(state => state.lists)

    let root = lists[id]

    if (!root)
      return null
    if (root.id > 0 && !expand)
      return root

    return [...flatten(root.children, lists, expand)]
  }
}

ListShow.register(API.LIST.SHOW)
