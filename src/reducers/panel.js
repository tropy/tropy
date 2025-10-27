import { PANEL, ITEM, PHOTO, NOTE } from '../constants/index.js'
import { merge, omit } from '../common/util.js'

const INIT = {
  expand: {}
}

const contract = (state, photos) => ({
  ...state,
  expand: omit(state.expand, photos)
})

const expand = (state, photo) => ({
  ...state,
  expand: { ...state.expand, [photo]: Date.now() }
})


export function panel(state = INIT, { type, payload, meta, error }) {
  switch (type) {
    case PANEL.RESTORE:
      return merge(INIT, payload)
    case PANEL.UPDATE:
      return merge(state, payload)
    case PHOTO.CONTRACT:
      return contract(state, payload)
    case PHOTO.EXPAND:
      return expand(state, payload)
    case PHOTO.SELECT:
    case NOTE.SELECT:
      return (payload?.selection == null) ?
        state :
          expand(state, payload.photo)
    case ITEM.OPEN:
      return (!meta.done || error) ? state : expand(state, payload.photo)
    default:
      return state
  }
}
