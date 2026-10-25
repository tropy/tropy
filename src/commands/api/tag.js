import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'
import { pluck } from '../../common/util.js'
import { findTag, getAllTags } from '../../selectors/index.js'


export class TagShow extends Command {
  *exec () {
    let { id, name } = this.action.payload

    // Look up by id only, unless a name is given.
    let tag = yield select(state =>
      (name == null) ? state.tags[id] : findTag(state, { name }))

    return tag
  }
}

TagShow.register(API.TAG.SHOW)


export class TagFind extends Command {
  *exec () {
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
