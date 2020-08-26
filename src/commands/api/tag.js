import { select } from 'redux-saga/effects'
import { Command } from '../command'
import { API } from '../../constants'
import { pluck } from '../../common/util'
import { findTag, getAllTags } from '../../selectors'


export class TagShow extends Command {
  *exec() {
    let { payload } = this.action
    let tag = yield select(state => findTag(state, payload))
    return tag
  }
}

TagShow.register(API.TAG.SHOW)


export class TagFind extends Command {
  *exec() {
    let { id, reverse } = this.action.payload

    let tags = (id == null) ?
      yield select(getAllTags) :
      yield select(state =>
        (id in state.items) ?
          pluck(state.tags, state.items[id].tags) :
          null)

    if (tags == null)
      return null
    if (reverse)
      return tags.reverse()
    else
      return tags
  }
}

TagFind.register(API.TAG.FIND)
