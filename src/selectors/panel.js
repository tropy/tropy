import { createSelector as memo } from 'reselect'
import { seq, compose, map, keep } from 'transducers.js'
import { getVisiblePhotos } from './photos'

const rev = (a, b) => a < b ? 1 : b < a ? -1 : 0

export const getExpandedPhotos = memo(
  ({ panel }) => panel.expand,
  ({ ui }) => ui.panel.zoom > 0,
  getVisiblePhotos,
  (expand, isGrid, photos) => {
    let expanded = seq(photos, compose(
      map(photo => expand[photo.id] > 0 ? photo : null),
      keep()
    ))

    if (isGrid) {
      expanded.sort((a, b) => rev(expand[a.id], expand[b.id]))
    }

    return expanded
  }
)
