import { createSelector as memo } from '@reduxjs/toolkit'
import { selectPhotoCursor, selectSelectionCursor } from '../slices/nav/selectors.js'
import { pluck } from '../common/util.js'

const NOTHING = []
const getSelections = ({ selections }) => selections

export const getActiveSelection = memo(
  getSelections,
  selectSelectionCursor,
  (selections, id) => (id != null) ? selections[id] : null
)

export const getActiveSelectionData = memo(
  ({ metadata }) => metadata,
  selectSelectionCursor,
  (metadata, id) => (id != null) ? metadata[id] : null
)


export const getPhotoSelections = memo(
  (state) => state.photos[selectPhotoCursor(state)]?.selections,
  getSelections,
  (photoSelections, selections) =>
    (photoSelections != null) ?
      pluck(selections, photoSelections) : NOTHING
)
