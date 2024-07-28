import ARGS from '../args.js'
import { INTL } from '../constants/index.js'

export function intl(state = {
  locale: ARGS.locale,
  defaultLocale: 'en'
}, action) {
  switch (action.type) {
    case INTL.UPDATE:
      return { ...state, ...action.payload }

    default:
      return state
  }
}
