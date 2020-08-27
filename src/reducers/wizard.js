import ARGS from '../args'
import { WIZARD } from '../constants'

const init = {
  project: { name: '', file: '' },
  userData: ARGS.documents
}

export function wizard(state = init, { type, payload }) {
  switch (type) {
    case WIZARD.PROJECT.UPDATE:
      return { ...state, project: { ...state.project, ...payload } }
    default:
      return state
  }
}
