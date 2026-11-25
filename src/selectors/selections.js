import { createSelector as memo } from '@reduxjs/toolkit'
import { selectCursorPhoto } from '../slices/nav/selectors.js'
import { resultEqualityCheck } from '../common/sequence.js'
import { pluck } from '../common/util.js'

const getSelections = ({ selections }) => selections

// The cursor photo's selections (Esper's overlays): keeps its
// identity unless one of them changes (Esper re-syncs on a new array).
export const getPhotoSelections = memo(
  (state) => selectCursorPhoto(state)?.selections,
  getSelections,
  (photoSelections, selections) =>
    pluck(selections, photoSelections ?? []), {
    memoizeOptions: { resultEqualityCheck }
  })
