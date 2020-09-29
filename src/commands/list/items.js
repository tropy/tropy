import { call } from 'redux-saga/effects'
import { Command } from '../command'
import { LIST } from '../../constants'
import act from '../../actions/list'
import mod from '../../models/list'


export class AddItems extends Command {
  *exec() {
    let { db } = this.options
    let { id, items } = this.action.payload

    let res = yield call(db.transaction, tx =>
      mod.items.add(tx, id, items))

    this.undo = act.items.remove({ id, items: res.items })
    this.redo = act.items.restore({ id, items: res.items })

    return { id, items: res.items }
  }
}

AddItems.register(LIST.ITEM.ADD)


export class RemoveItems extends Command {
  *exec() {
    let { db } = this.options
    let { id, items } = this.action.payload

    yield call(mod.items.remove, db, id, items)

    this.undo = act.items.restore({ id, items })

    return { id, items }
  }
}

RemoveItems.register(LIST.ITEM.REMOVE)


export class RestoreItems extends Command {
  *exec() {
    let { db } = this.options
    let { id, items } = this.action.payload

    yield call(mod.items.restore, db, id, items)

    this.undo = act.items.remove({ id, items })

    return { id, items }
  }
}

RestoreItems.register(LIST.ITEM.RESTORE)
