import ARGS from '../args.js'
import { SETTINGS, ITEM, PHOTO, SELECTION, ESPER, NOTE } from '../constants/index.js'
import { darwin } from '../common/os.js'
import { merge } from '../common/util.js'
import { dc } from '../ontology/ns.js'

const defaults = {
  completions: 'datatype',
  deleteTrash: 'close',
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
  maximize: 'none',
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

export function settings(state = defaults, { type, payload, meta, error }) {
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
    case NOTE.OPEN:
      return (!meta.done || error || state.maximize !== 'esper') ? state : {
        ...state,
        maximize: 'none'
      }
    default:
      return state
  }
}
