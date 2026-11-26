import { createSelector } from '@reduxjs/toolkit'
import { resultEqualityCheck } from '../common/sequence.js'
import { BLANK } from '../common/util.js'

// The view (position, zoom, etc.) Esper keeps for a photo or selection.
export const selectEsperView = (state, id) =>
  state.esper.view[id] ?? BLANK

// The selections of a photo, drawn by Esper as overlays.
export const selectEsperSelections = createSelector(
  (state) => state.selections,
  (state, id) => state.photos[id]?.selections,
  (selections, selectionIds = []) => {
    let photoSelections = []

    for (let id of selectionIds) {
      let selection = selections[id]
      if (selection != null) photoSelections.push(selection)
    }

    return photoSelections
  }, {
    memoizeOptions: { resultEqualityCheck }
  })
