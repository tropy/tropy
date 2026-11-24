import { PANEL, PHOTO } from '../constants/index.js'
import {
  itemOpened,
  itemSelected,
  noteSelected,
  photoSelected
} from '../slices/nav/actions.js'
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


export function panel (state = INIT, { type, payload }) {
  switch (type) {
    case PANEL.RESTORE:
      return merge(INIT, payload)
    case PANEL.UPDATE:
      return merge(state, payload)
    case PHOTO.CONTRACT:
      return contract(state, payload)
    case PHOTO.EXPAND:
      return expand(state, payload)
    case photoSelected.type:
    case noteSelected.type:
    case itemSelected.type:
      return (payload?.selection == null) ?
        state :
        expand(state, payload.photo)
    case itemOpened.type:
      return (payload.photo == null) ?
        state :
        expand(state, payload.photo)
    default:
      return state
  }
}
