import { EDIT, METADATA, PROJECT, TAG } from '../constants'

export function edit(state = {}, { type, payload, meta }) {
  switch (type) {
    case EDIT.START:
      return { ...payload }

    case METADATA.SAVE:
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
