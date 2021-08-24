import { createSelector as memo } from 'reselect'
import { seq, compose, map, keep } from 'transducers.js'
import { getVisiblePhotos } from './photos'

const rev = (a, b) => a < b ? 1 : b < a ? -1 : 0

export const getExpandedPhotos = memo(
  ({ panel }) => panel.expand,
  ({ ui }) => ui.panel.zoom > 0,
  getVisiblePhotos,
  (expand, isGrid, photos) => {
    let expandedPhotos = seq(photos, compose(
      map(({ id, selections }) =>
        (expand[id] > 0 && selections.length > 0) ? { id, selections } : null),
      keep()
    ))

    if (isGrid) {
      expandedPhotos = expandedPhotos
        .sort((a, b) => rev(expand[a.id], expand[b.id]))
        .slice(0, 1)
    }

    return expandedPhotos.reduce((exp, { id, selections }) => (
      exp[id] = selections, exp
    ), {})
  }
)
