import ARGS from '../args'
import { INTL } from '../constants'

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
