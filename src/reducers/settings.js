import ARGS from '../args'
import { SETTINGS, ITEM, PHOTO, SELECTION, ESPER } from '../constants'
import { darwin } from '../common/os'
import { merge } from '../common/util'
import { dc } from '../ontology'

const defaults = {
  completions: 'datatype',
  dup: 'prompt',
  density: 72,
  export: {
    note: {
      format: {
        text: true,
        html: true,
        markdown: false
      },
      copyFormat: 'text',
      localize: true
    }
  },
  layout: ITEM.LAYOUT.STACKED,
  localtime: true,
  tagColor: null,
  templates: {
    item: ITEM.TEMPLATE.DEFAULT,
    photo: PHOTO.TEMPLATE.DEFAULT,
    selection: SELECTION.TEMPLATE.DEFAULT
  },
  theme: ARGS.theme,
  title: {
    item: dc.title,
    photo: dc.title,
    force: false
  },
  overlayToolbars: ARGS.frameless,
  print: {
    mode: 'photo',
    photos: true,
    optimize: true,
    metadata: true,
    notes: true,
    onlyNotes: false,
    overflow: false
  },
  invertScroll: true,
  invertZoom: darwin,
  zoomMode: ESPER.MODE.FIT
}

export function settings(state = defaults, { type, payload }) {
  switch (type) {
    case SETTINGS.RESTORE:
      return {
        ...merge(defaults, payload),
        fontSize: ARGS.fontSize,
        theme: ARGS.theme,
        locale: ARGS.locale
      }
    case SETTINGS.UPDATE:
      return merge(state, payload)
    default:
      return state
  }
}
