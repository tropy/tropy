'use strict'

const { SETTINGS, ITEM, ESPER } = require('../constants')

const defaults = {
  debug: ARGS.debug,
  dup: 'prompt',
  locale: ARGS.locale,
  template: ITEM.TEMPLATE,
  theme: ARGS.theme,
  overlayToolbars: ARGS.frameless,
  invertScroll: true,
  invertZoom: false,
  zoomMode: ESPER.MODE.FIT
}

module.exports = {
  settings(state = defaults, { type, payload }) {
    switch (type) {
      case SETTINGS.RESTORE:
        return {
          ...defaults,
          ...payload,
          theme: ARGS.theme,
          locale: ARGS.locale
        }
      case SETTINGS.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
