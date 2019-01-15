'use strict'

const { PANEL, ITEM, PHOTO, NOTE } = require('../constants')
const { merge, omit } = require('../common/util')

const INIT = {
  expand: {  }
}

const contract = (state, photos) => ({
  ...state,
  expand: omit(state.expand, photos)
})

const expand = (state, photo) => ({
  ...state,
  expand: { ...state.expand, [photo]: Date.now() }
})


module.exports = {
  panel(state = INIT, { type, payload }) {
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
        return (payload.selection == null) ?
          state :
          expand(state, payload.photo)
      case ITEM.OPEN:
        return expand(state, payload.photos[0])
      case NOTE.SELECT:
        return expand(state, payload.photo)
      default:
        return state
    }
  }
}
