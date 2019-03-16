'use strict'

const { SETTINGS, ITEM, PHOTO, SELECTION, ESPER, DC } = require('../constants')
const { merge } = require('../common/util')
const { darwin } = require('../common/os')

const defaults = {
  debug: ARGS.debug,
  dup: 'prompt',
  layout: ITEM.LAYOUT.STACKED,
  locale: ARGS.locale,
  localtime: true,
  tagColor: null,
  templates: {
    item: ITEM.TEMPLATE.DEFAULT,
    photo: PHOTO.TEMPLATE.DEFAULT,
    selection: SELECTION.TEMPLATE.DEFAULT
  },
  theme: ARGS.theme,
  title: {
    item: DC.title,
    photo: DC.title,
    force: false
  },
  overlayToolbars: ARGS.frameless,
  invertScroll: true,
  invertZoom: darwin,
  zoomMode: ESPER.MODE.FIT
}

module.exports = {
  settings(state = defaults, { type, payload }) {
    switch (type) {
      case SETTINGS.RESTORE:
        return {
          ...merge(defaults, payload),
          theme: ARGS.theme,
          locale: ARGS.locale
        }
      case SETTINGS.UPDATE:
        return merge(state, payload)
      default:
        return state
    }
  }
}
