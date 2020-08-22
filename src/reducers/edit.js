import { EDIT } from '../constants'

export function edit(state = {}, { type, payload }) {
  switch (type) {
    case EDIT.START:
      return { ...payload }
    case EDIT.CANCEL:
      return {}
    default:
      return state
  }
}
