import { HISTORY } from '../constants/index.js'
import { omit } from '../common/util.js'

const dup = (action, history, agent) => ({
  ...action,
  meta: {
    ...omit(action.meta, ['agent']),
    ...(agent && { agent }),
    history
  }
})

export default {
  undo (payload, meta) {
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

  redo (payload, meta) {
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

  tick ({ undo, redo, mode = 'add', agent }, meta) {
    return {
      type: HISTORY.TICK,
      payload: {
        undo: dup(undo, 'undo'),
        redo: dup(redo, 'redo', agent)
      },
      meta: {
        ipc: HISTORY.CHANGED,
        log: mode === 'merge' ? false : 'trace',
        mode,
        ...meta
      }
    }
  },

  drop (payload, meta) {
    return {
      type: HISTORY.DROP,
      payload,
      meta: {
        ipc: HISTORY.CHANGED,
        log: 'trace',
        ...meta
      }
    }
  }
}
