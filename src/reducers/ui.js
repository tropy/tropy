'use strict'

const { ESPER, ITEM, PHOTO, NOTE, UI, SASS } = require('../constants')
const { merge, omit } = require('../common/util')

const INIT = {
  esper: {
    height: 50,
    width: 50,
    placement: ESPER.PLACEMENT.TOP,
    tool: ESPER.TOOL.PAN,
    panel: false
  },
  expand: {},
  panel: {
    slots: [
      { height: 40, isClosed: false },
      { height: 40, isClosed: false },
      { height: 20, isClosed: false }
    ],
    tab: 'metadata',
    width: SASS.PANEL.DEFAULT_WIDTH,
    zoom: 0
  },
  sidebar: {
    width: SASS.SIDEBAR.DEFAULT_WIDTH
  },
  zoom: 0
}

function contract(state, photos) {
  return {
    ...state, expand: omit(state.expand, photos)
  }
}

function expand(state, photo) {
  return {
    ...state, expand: { ...state.expand, [photo]: Date.now() }
  }
}


module.exports = {
  ui(state = INIT, { type, payload }) {
    switch (type) {
      case UI.RESTORE:
        return merge(INIT, payload)
      case UI.UPDATE:
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
