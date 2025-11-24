import assert from 'node:assert/strict'
import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { NOTE } from '../../constants/index.js'
import { getNoteParent } from '../../selectors/index.js'
import { emit } from '../../dom.js'

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

    let delay = 25
    let [isProjectMode, isMinimized] = yield select(state => ([
      state.nav.mode === 'project',
      state.settings.maximize === 'esper'
    ]))

    if (isProjectMode) delay += 800
    if (isMinimized) delay += 100

    setTimeout(() => {
      emit(document, 'global:note-open')
    }, delay)

    return {
      item,
      photo,
      selection,
      note: id
    }
  }
}

Open.register(NOTE.OPEN)
