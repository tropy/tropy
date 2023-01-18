import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import NOTE from '../../constants/note.js'
import { pick } from '../../common/util.js'
import actions from '../../actions/note.js'

const wasPreviouslyCreated = (id, past) =>
  past?.undo.type === NOTE.DELETE &&
    past.undo.payload?.[0] === id &&
    past.undo.payload.length === 1

class Update extends Command {
  *exec() {
    let note = this.action.payload

    let [original, past] = yield select(({ notes, history }) => ([
      pick(notes[note.id], Object.keys(note)),
      history.past[0]
    ]))

    // Subtle: when a note is updated immediately after creation,
    // we do not add updates to the history stack.
    // This way, `undo` after the initial session will remove the note,
    // skipping the initial state (typically a single character).
    if (!wasPreviouslyCreated(note.id, past)) {
      this.undo = actions.update(original)
      this.redo = actions.update(note)
    }

    return note
  }
}

Update.register(NOTE.UPDATE)
