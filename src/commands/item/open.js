import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'


export class Open extends Command {
  *exec() {
    let { id, photo, selection, note } = this.action.payload

    let [item, nav] = yield select(state => ([
      state.items[id],
      state.nav
    ]))

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
