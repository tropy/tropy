import { EDIT, METADATA } from '../constants'

export function edit(state = {}, { type, payload }) {
  switch (type) {
    case EDIT.START:
      return { ...payload }
    case METADATA.SAVE:
    case EDIT.CANCEL:
      return {}
    default:
      return state
  }
}
