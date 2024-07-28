import { EDIT, PROJECT, TAG } from '../constants/index.js'

export function edit(state = {}, { type, payload, meta }) {
  switch (type) {
    case EDIT.START:
      return { ...payload }

    case PROJECT.SAVE:
    case TAG.CREATE:
    case TAG.SAVE:
      return (meta.done) ? {} : state
    case EDIT.CANCEL:
      return {}

    default:
      return state
  }
}
