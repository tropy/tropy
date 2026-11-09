import { put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { selectViewOf } from '../../slices/qr.js'
import * as act from '../../actions/index.js'


export class Open extends Command {
  *exec () {
    let { id, photo, selection, note } = this.action.payload

    let [item, nav, selections] = yield select(state => ([
      state.items[id],
      state.nav,
      state.selections
    ]))

    // Do nothing for missing/bad ids!
    if (item == null)
      return null
    if (photo && !item.photos.includes(photo))
      return null
    if (selection && selections[selection]?.photo !== photo)
      return null

    // Not among the results (opened by a link or the API):
    // a new search for a view that shows it.
    let view = yield select(selectViewOf, id)
    if (view != null) yield put(act.nav.select(view))

    if (!photo) {
      photo = item.photos.includes(nav.photo) ?
        nav.photo : item.photos[0]
    }

    if (!note) {
      let obj = yield select(state => (
        state.selections[selection] || state.photos[photo]
      ))

      if (obj?.notes)
        note = obj.notes.includes(nav.note) ?
          nav.note : obj.notes[0]
    }

    return {
      id,
      photo,
      selection,
      note
    }
  }
}

Open.register(ITEM.OPEN)
