import { BLANK, get } from '../common/util.js'

export const getEsperViewState = ({ esper, nav }) =>
  get(esper.view, [nav.selection ?? nav.photo], BLANK)
