import { ITEM } from '../constants/index.js'
import { array } from '../common/util.js'
import { focus, from as toSelection } from '../common/selection.js'
import { show } from '../slices/nav/actions.js'
import { checkCursorPath, selectCursorPaths } from '../slices/nav/path.js'
import { selectViewOf } from '../slices/qr.js'

// Selects items, and optionally a cursor path below the item
// at the cursor: photo, photo selection, note (checked; see
// slices/nav/path.js). The item selection is a state, an id or ids
// (see from). The reducer completes the path from the item's paths
// (the default cursor path). The mode is a hint ('item' from open).
function select ({ item, photo, selection, note, mode }, meta = {}) {
  return (dispatch, getState) => {
    let state = getState()

    item = toSelection(item)

    if (item.cursor != null)
      checkCursorPath(state, { item: item.cursor, photo, selection, note })

    return dispatch({
      type: ITEM.SELECT,
      payload: {
        item,
        photo,
        selection,
        note,
        mode,
        ...(item.cursor != null && selectCursorPaths(state, item.cursor))
      },
      meta: { log: 'trace', history: true, ...meta }
    })
  }
}

// Opens an item: selects it in item mode. A selected item stays
// in the selection (the cursor moves there), else it is selected
// alone. An item not among the results is shown first (a new
// search for a view that shows it): from the API or a link.
function open ({ id, photo, selection, note } = {}, meta) {
  return (dispatch, getState) => {
    let state = getState()

    if (state.items[id] == null)
      throw new Error(`unknown item ${id}`)

    checkCursorPath(state, { item: id, photo, selection, note })

    let view = selectViewOf(state, id)
    if (view != null) dispatch(show(view))

    return dispatch(select({
      item: focus(getState().nav.selection.item, id),
      photo,
      selection,
      note,
      mode: 'item'
    }, meta))
  }
}

export default {
  create (payload, meta) {
    return {
      type: ITEM.CREATE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  import (payload = {}, meta) {
    return {
      type: ITEM.IMPORT,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        cancel: true,
        search: true,
        prompt: 'items',
        ...meta
      }
    }
  },

  delete (payload, meta) {
    return {
      type: ITEM.DELETE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  destroy (payload, meta) {
    return {
      type: ITEM.DESTROY,
      payload: array(payload),
      meta: { cmd: 'project', prompt: true, ...meta }
    }
  },

  merge (payload, meta) {
    return {
      type: ITEM.MERGE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  split (payload, meta) {
    return {
      type: ITEM.SPLIT,
      payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  explode (payload, meta) {
    return {
      type: ITEM.EXPLODE,
      payload: payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  export (payload, meta) {
    return {
      type: ITEM.EXPORT,
      payload: array(payload),
      meta: { cmd: 'project', ...meta }
    }
  },

  implode (payload, meta) {
    return {
      type: ITEM.IMPLODE,
      payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  insert (payload, meta) {
    return {
      type: ITEM.INSERT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  load (payload, meta) {
    return {
      type: ITEM.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  remove (payload, meta) {
    return {
      type: ITEM.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  restore (payload, meta) {
    return {
      type: ITEM.RESTORE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  update (payload, meta) {
    return {
      type: ITEM.UPDATE,
      payload,
      meta: meta
    }
  },

  select,

  open,

  preview (payload, meta) {
    return {
      type: ITEM.PREVIEW,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  print (payload, meta) {
    return {
      type: ITEM.PRINT,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  bulk: {
    update (payload, meta) {
      return {
        type: ITEM.BULK.UPDATE,
        payload,
        meta: meta
      }
    }
  },

  tags: {
    toggle (payload, meta = {}) {
      return {
        type: ITEM.TAG.TOGGLE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    clear (payload, meta = {}) {
      return {
        type: ITEM.TAG.CLEAR,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    create (payload, meta) {
      return {
        type: ITEM.TAG.CREATE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    insert (payload, meta) {
      return {
        type: ITEM.TAG.INSERT,
        payload,
        meta: { ...meta }
      }
    },

    delete (payload, meta) {
      return {
        type: ITEM.TAG.DELETE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    remove (payload, meta) {
      return {
        type: ITEM.TAG.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  photos: {
    add (payload, meta) {
      return {
        type: ITEM.PHOTO.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove (payload, meta) {
      return {
        type: ITEM.PHOTO.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  template: {
    change ({ id, template }, meta) {
      return {
        type: ITEM.TEMPLATE.CHANGE,
        payload: {
          id: array(id),
          property: 'template',
          value: template
        },
        meta: {
          cmd: 'project',
          history: 'add',
          ...meta
        }
      }
    }
  }
}
