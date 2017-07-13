'use strict'

const { SETTINGS, ITEM, PHOTO } = require('../constants')

const defaults = {
  theme: ARGS.theme,
  itemTemplate: ITEM.TEMPLATE,
  photoTemplate: PHOTO.TEMPLATE
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
