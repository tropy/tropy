import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { LIST } from '../../constants'
import { splice } from '../../common/util'
import act from '../../actions/list'
import mod from '../../models/list'


export class Create extends Command {
  *exec() {
    let { payload } = this.action
    let { db } = this.options
    let { name, parent } = payload

    let { children } = yield select(state => state.lists[parent])
    let idx = children.length

    const list = yield call(mod.create, db, { name, parent, position: idx + 1 })

    yield put(act.insert(list, { idx }))

    this.undo = act.delete(list.id)
    this.redo = act.restore(list, { idx })

    return list
  }
}

Create.register(LIST.CREATE)


export class Delete extends Command {
  *exec() {
    let { payload: id } = this.action
    let { db } = this.options
    let { lists } = yield select()

    let original = lists[id]
    let parent = lists[original.parent]

    let idx = parent.children.indexOf(id)
    let cid = splice(parent.children, idx, 1)

    yield call(db.transaction, async tx => {
      await mod.remove(tx, id)
      await mod.order(tx, parent.id, cid)
    })

    yield put(act.remove(id))

    this.undo = act.restore(original, { idx })

    return [original, idx]
  }
}

Delete.register(LIST.DELETE)


export class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { idx } = this.action.meta
    let list = this.action.payload

    let { children } = yield select(state => state.lists[list.parent])
    let cid = splice(children, idx, 0, list.id)

    yield call(db.transaction, async tx => {
      await mod.restore(tx, list.id, list.parent)
      await mod.order(tx, list.parent, cid)
    })

    yield put(act.insert(list, { idx }))

    this.undo = act.delete(list.id)
  }
}

Restore.register(LIST.RESTORE)
