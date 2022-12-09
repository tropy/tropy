import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import NOTE from '../../constants/note.js'
import { pick } from '../../common/util.js'
import actions from '../../actions/note.js'


class Update extends Command {
  *exec() {
    let note = this.action.payload

    let original = yield select(({ notes }) => (
      pick(notes[note.id], Object.keys(note))
    ))

    this.undo = actions.update(original)
    this.redo = actions.update(note)

    return note
  }
}

Update.register(NOTE.UPDATE)
