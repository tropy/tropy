import assert from 'node:assert/strict'
import { put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { NOTE } from '../../constants/index.js'
import { selectViewOf } from '../../slices/qr.js'
import * as act from '../../actions/index.js'
import { getNoteParent, getPrimaryItemId } from '../../selectors/index.js'
import { emit } from '../../dom.js'

export class Open extends Command {
  *exec () {
    let { id = null } = this.action.payload
    let item, photo, selection

    if (id != null) {
      ({ item, photo, selection } = yield select(getNoteParent, { id }))
    } else {
      [item, photo, selection] = yield select(state => ([
        getPrimaryItemId(state),
        state.nav.photo,
        state.nav.selection
      ]))
    }

    assert(photo || selection, 'cannot open note without active photo/selection')

    // Not among the results: a new search for a view that shows it.
    let view = yield select(selectViewOf, item)
    if (view != null) yield put(act.nav.select(view))

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
