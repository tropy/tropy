'use strict'

const { SETTINGS, ITEM, PHOTO } = require('../constants')

const defaults = {
  dup: 'prompt',
  itemTemplate: ITEM.TEMPLATE,
  photoTemplate: PHOTO.TEMPLATE,
  theme: ARGS.theme
}

module.exports = {
  settings(state = defaults, { type, payload }) {
    switch (type) {
      case SETTINGS.RESTORE:
        return { ...defaults, ...payload, theme: ARGS.theme }
      case SETTINGS.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
