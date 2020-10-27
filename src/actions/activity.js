import { ACTIVITY } from '../constants'
import { pick } from '../common/util'

export default {
  cancel(id, meta) {
    return {
      type: ACTIVITY.CANCEL,
      payload: {
        id
      },
      meta: {
        ...meta,
        rel: id
      }
    }
  },

  done(action, result, meta) {
    let error = result instanceof Error
    let payload = !error ?
      result :
      pick(result, ['code', 'message', 'stack', 'type'])

    return {
      type: action.type,
      payload,
      error,
      meta: {
        ipc: action.meta.ipc,
        idx: action.meta.idx,
        rsvp: action.meta.rsvp,
        search: action.meta.search,
        ...meta,
        done: true,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  },

  update(action, payload, meta) {
    return {
      type: ACTIVITY.UPDATE,
      payload,
      meta: {
        ...meta,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  }
}
