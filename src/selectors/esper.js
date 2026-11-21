import { BLANK, get } from '../common/util.js'

export const getEsperViewState = ({ esper, nav: { selection } }) =>
  get(esper.view, [selection.selection ?? selection.photo], BLANK)
