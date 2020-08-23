import { CONTEXT } from '../constants'

export default {
  show(event, scope = 'default', target, meta) {
    return {
      type: CONTEXT.SHOW,
      payload: {
        scope,
        event: {
          target,
          x: event.clientX,
          y: event.clientY
        }
      },
      meta: { ipc: true, ...meta }
    }
  },

  clear(payload, meta) {
    return {
      type: CONTEXT.CLEAR,
      payload,
      meta
    }
  }
}
