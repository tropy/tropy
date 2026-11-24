import { NOTE } from '../constants/index.js'
import { emit } from '../dom.js'
import { open } from '../slices/nav/actions.js'
import settings from './settings.js'
import { selectNavCursor } from '../slices/nav/cursor.js'
import { getNoteParent } from '../selectors/notes.js'

export default {
  create (payload, meta) {
    return {
      type: NOTE.CREATE,
      payload: payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  export (payload, meta = {}) {
    return {
      type: NOTE.EXPORT,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  insert (payload, meta = {}) {
    return {
      type: NOTE.INSERT,
      payload,
      meta
    }
  },

  save (payload, meta) {
    return {
      type: NOTE.SAVE,
      payload: payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  // Opens a note (id) in item mode, or without an id
  // the blank notepad of the current photo, and focuses it.
  open ({ id = null } = {}, meta) {
    return (dispatch, getState) => {
      let state = getState()

      let { item: parent, photo, selection } = (id != null)
        ? getNoteParent(state, { id })
        : selectNavCursor(state)

      if (photo == null)
        throw new Error('cannot open note without photo')

      let result = dispatch(open.item({
        id: parent,
        photo,
        selection,
        note: id
      }, meta))

      let delay = 25

      if (state.nav.mode === 'project')
        delay += 800

      if (state.settings.maximize === 'esper') {
        dispatch(settings.update({ maximize: 'none' }))
        delay += 100
      }

      setTimeout(() => {
        emit(document, 'global:note-open')
      }, delay)

      return result
    }
  },

  load (payload, meta) {
    return {
      type: NOTE.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  update (payload, meta) {
    return {
      type: NOTE.UPDATE,
      payload,
      meta: {
        cmd: 'project',
        history: 'merge',
        log: false,
        ...meta
      }
    }
  },

  delete (payload, meta) {
    return {
      type: NOTE.DELETE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  restore (payload, meta) {
    return {
      type: NOTE.RESTORE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  }
}
