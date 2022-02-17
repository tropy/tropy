import { BLANK } from '../common/util'
import { createSelector } from 'reselect'
import { getSelectedPhotoIds } from './photos'

export const getEsperViewState = createSelector(
  ({ esper }) => esper.view,
  getSelectedPhotoIds,
  ({ nav }) => nav.selection,
  (view, photos, selection) =>
    view[selection ?? photos.at(-1)] || BLANK
)

