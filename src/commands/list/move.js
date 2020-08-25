import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { LIST } from '../../constants'
import { pluck, splice, warp } from '../../common/util'
import act from '../../actions/list'
import mod from '../../models/list'


export class Move extends Command {
  *exec() {
    let { db } = this.options
    let list = this.action.payload
    let to = this.action.meta.idx
    let idx

    let [original, parent] = yield select(state =>
      pluck(state.lists, [list.id, list.parent]))

    if (parent.id === original.parent) {
      idx = parent.children.indexOf(list.id)
      let children = warp(parent.children, idx, to)

      yield call(mod.order, db, parent.id, children)
      yield put(act.update({ id: parent.id, children }))

    } else {
      let oldParent = yield select(state => state.lists[original.parent])
      idx = oldParent.children.indexOf(list.id)

      let oldChildren = splice(oldParent.children, idx, 1)
      let children = splice(parent.children, to, 0, list.id)

      yield call(db.transaction, async tx => {
        await mod.save(tx, { id: list.id, parent_list_id: parent.id })
        await mod.order(tx, parent.id, children)
        await mod.order(tx, oldParent.id, oldChildren)
      })

      yield put(act.update([
        { id: oldParent.id, children: oldChildren },
        { id: list.id, parent: parent.id },
        { id: parent.id, children }
      ]))
    }

    this.undo = act.move({ id: list.id, parent: original.parent }, { idx })
    return list
  }
}

Move.register(LIST.MOVE)
