import { createSelector as memo } from '@reduxjs/toolkit'
import { selectActivePhotos } from '../slices/nav/selectors.js'

const rev = (a, b) => a < b ? 1 : b < a ? -1 : 0

export const getExpandedPhotos = memo(
  ({ panel }) => panel.expand,
  ({ ui }) => ui.panel.zoom > 0,
  selectActivePhotos,
  (expand, isGrid, photos) => {
    let expandedPhotos = photos.filter(({ id, selections }) =>
      expand[id] > 0 && selections.length > 0)

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
