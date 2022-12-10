import { HISTORY } from '../constants'
import { omit } from '../common/util'

export default {
  undo(payload, meta) {
    return (dispatch, getState) => {
      let { history } = getState()
      if (history.past.length > 0) {
        dispatch({
          type: HISTORY.UNDO,
          payload,
          meta: {
            ipc: HISTORY.CHANGED,
            ...meta
          }
        })
      }
    }
  },

  redo(payload, meta) {
    return (dispatch, getState) => {
      let { history } = getState()
      if (history.future.length > 0) {
        dispatch({
          type: HISTORY.REDO,
          payload,
          meta: {
            ipc: HISTORY.CHANGED,
            ...meta
          }
        })
      }
    }
  },

  tick({ undo, redo, mode = 'add' }, meta) {
    undo.meta = omit(undo.meta, ['history'])
    redo.meta = omit(redo.meta, ['history'])

    return {
      type: HISTORY.TICK,
      payload: { undo, redo },
      meta: {
        ipc: HISTORY.CHANGED,
        log: mode === 'merge' ? false : 'debug',
        mode,
        ...meta
      }
    }
  },

  drop(payload, meta) {
    return {
      type: HISTORY.DROP,
      payload,
      meta: {
        ipc: HISTORY.CHANGED,
        ...meta
      }
    }
  }
}
