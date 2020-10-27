import assert from 'assert'
import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { TAG, SASS } from '../../constants'
import { sample } from '../../common/util'
import { findTag } from '../../selectors'
import * as mod from '../../models'
import * as act from '../../actions'


export class Create extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { items, ...data } = payload
    let tag

    assert(data.name != null, 'tag.name missing')

    if (meta.resolve)
      tag = yield select(state => findTag(state, {
        id: data.name
      }))

    if (tag != null)
      return tag

    let hasItems = (items && items.length > 0)
    let color = yield select(state => state.settings.tagColor)

    if (data.color == null)
      data.color = color
    if (data.color === 'random')
      data.color = sample(SASS.TAG.COLORS)

    tag = yield call(db.transaction, async tx => {
      let tg = await mod.tag.create(tx, data)
      if (hasItems) await mod.item.tags.add(tx, { id: items, tag: tg.id })
      return tg
    })

    if (hasItems) {
      yield put(act.item.tags.insert({ id: items, tags: [tag.id] }))
    }

    this.undo = act.tag.delete(tag.id)

    return tag
  }
}

Create.register(TAG.CREATE)


export class Delete extends Command {
  *exec() {
    let { db } = this.options
    let id = this.action.payload

    let items = yield call(mod.tag.items, db, id)
    let tag = yield select(state => state.tags[id])

    yield call(mod.tag.delete, db, [id])

    if (items.length > 0) {
      yield put(act.item.tags.remove({ id: items, tags: [id] }))
    }

    this.undo = act.tag.create({ ...tag, items })

    return id
  }
}

Delete.register(TAG.DELETE)

