import assert from 'node:assert/strict'
import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { NOTE } from '../../constants/index.js'
import { getNoteParent } from '../../selectors/index.js'

export class Open extends Command {
  *exec() {
    let { id = null, photo, selection } = this.action.payload
    let item

    if (id != null) {
      ({ item, photo, selection } = yield select(getNoteParent, { id }))
    } else {
      [item, photo, selection] = yield select(({ nav }) => ([
        nav.items[0],
        nav.photo,
        nav.selection
      ]))
    }

    assert(photo || selection, 'cannot open note without active photo/selection')

    return {
      item,
      photo,
      selection,
      note: id
    }
  }
}

Open.register(NOTE.OPEN)
