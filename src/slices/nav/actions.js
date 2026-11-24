import { createAction } from '@reduxjs/toolkit'
import { ITEM, NOTE, PHOTO } from '../../constants/index.js'
import { focus, primary, from as toSelection } from '../../common/selection.js'
import { checkCursorPath, selectCursorPaths, selectNoteIds } from './path.js'
import { selectViewOf } from '../qr.js'

export const restore = createAction('nav/restore')

// Shows a view: { view, query, tags }.
// This is basically a click in the project sidebar.
export const show = createAction('nav/show', (payload, meta) => ({
  payload,
  meta: {
    log: 'trace',
    history: true,
    search: true,
    ...meta
  }
}))

// The select actions (thunks): each checks its input against the
// data and passes the facts the reducer needs (see path.js);
// a failed check throws.
export const select = {
  // Selects items, and optionally a cursor path below the primary
  // item: photo, photo selection, note. The item selection is a
  // state, an id or ids (see from). The reducer completes the path
  // from the item's paths (the default cursor path).
  // The mode is a hint ('item' from open.item).
  item ({ item, photo, selection, note, mode }, meta = {}) {
    return (dispatch, getState) => {
      let state = getState()

      item = toSelection(item)
      let id = primary(item)

      checkCursorPath(state, { item: id, photo, selection, note })

      return dispatch({
        type: ITEM.SELECT,
        payload: {
          item,
          photo,
          selection,
          note,
          mode,
          ...(id != null && selectCursorPaths(state, id))
        },
        meta: { log: 'trace', history: true, ...meta }
      })
    }
  },

  photo (payload, meta) {
    return (dispatch, getState) => {
      let state = getState()
      let { item, photo, selection, note } = payload ?? {}
      let notes

      if (photo != null) {
        item ??= state.photos[photo]?.item
        checkCursorPath(state, { item, photo, selection, note })
        notes = selectNoteIds(state, selection ?? photo) ?? []
      }

      return dispatch({
        type: PHOTO.SELECT,
        payload: {
          item,
          photo,
          selection,
          note,
          notes
        },
        meta: { log: 'trace', history: true, ...meta }
      })
    }
  },

  note (payload, meta) {
    if (payload == null)
      return {
        type: NOTE.SELECT,
        payload,
        meta
      }

    return (dispatch, getState) => {
      let state = getState()
      let { note, photo, item, selection } = payload

      photo ??= state.selections[selection]?.photo
      item ??= state.photos[photo]?.item

      checkCursorPath(state, { item, photo, selection, note })

      return dispatch({
        type: NOTE.SELECT,
        payload: { note, photo, item, selection },
        meta: { log: 'trace', history: true, ...meta }
      })
    }
  }
}

export const open = {
  // Opens an item: selects it in item mode. A selected item stays
  // in the selection (the cursor moves there), else it is selected
  // alone. An item not among the results is shown first (a new
  // search for a view that shows it): from the API or a link.
  item ({ id, photo, selection, note } = {}, meta) {
    return (dispatch, getState) => {
      let state = getState()

      if (state.items[id] == null)
        throw new Error(`unknown item ${id}`)

      checkCursorPath(state, { item: id, photo, selection, note })

      let view = selectViewOf(state, id)
      if (view != null) dispatch(show(view))

      return dispatch(select.item({
        item: focus(getState().nav.selection.item, id),
        photo,
        selection,
        note,
        mode: 'item'
      }, meta))
    }
  }
}
