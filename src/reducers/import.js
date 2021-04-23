import { IMPORTS, ITEM } from '../constants'

const THRESHOLD = 1000 * 60 * 2

function merge(state, items, time = Date.now()) {
  let lastImportTime = state[0]?.time

  if ((time - lastImportTime) < THRESHOLD)
    return [{ time, items: [...state[0].items, ...items] }]
  else
    return [{ time, items }]
}

export function imports(state = [], { type, payload, error, meta }) {
  switch (type) {
    case IMPORTS.RESTORE:
      return (payload != null) ? [...payload] : []
    case ITEM.IMPORT:
      return (!meta.done || error || !payload.length) ?
        state :
        merge(state, payload)
    default:
      return state
  }
}
