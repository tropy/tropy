import { createSelector as memo } from '@reduxjs/toolkit'
import { selectCursorPhoto } from '../slices/nav/selectors.js'
import { pluck } from '../common/util.js'

const NOTHING = []
const getSelections = ({ selections }) => selections

export const getPhotoSelections = memo(
  (state) => selectCursorPhoto(state)?.selections,
  getSelections,
  (photoSelections, selections) =>
    (photoSelections != null) ?
      pluck(selections, photoSelections) : NOTHING
)
