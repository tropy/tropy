import { IMPORTS, ITEM } from '../constants'

export function imports(state = [], { type, payload, error, meta }) {
  switch (type) {
    case IMPORTS.RESTORE:
      return (payload != null) ? [...payload] : []
    case ITEM.IMPORT:
      return (!meta.done || error || !payload.length) ? state : [{
        time: Date.now(),
        items: payload
      }]
    default:
      return state
  }
}
