'use strict'

const { ESPER, PHOTO, UI, SASS } = require('../constants')
const { merge, omit } = require('../common/util')

const init = {
  esper: {
    height: 50,
    tool: ESPER.TOOL.PAN
  },
  image: {},
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
  ui(state = init, { type, payload }) {
    switch (type) {
      case UI.RESTORE:
        return merge(init, payload)
      case UI.UPDATE:
        return merge(state, payload)
      case PHOTO.CONTRACT:
        return contract(state, payload)
      case PHOTO.EXPAND:
        return expand(state, payload)
      default:
        return state
    }
  }
}
