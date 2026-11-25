import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { selectActivePhotos } from '../slices/nav/selectors.js'

const isExpanded = (exp, photo) =>
  exp[photo.id] > 0 && photo.selections.length > 0

const isMoreRecentlyExpanded = (exp, photo, cur) =>
  isExpanded(exp, photo) && (cur == null || exp[photo.id] > exp[cur.id])

// The grid's expansion; the most recently expanded active photo.
export const selectPhotoExpansion = createSelector(
  ({ panel }) => panel.expand,
  selectActivePhotos,
  (expand, photos) => {
    let expansion = null

    for (let photo of photos) {
      if (isMoreRecentlyExpanded(expand, photo, expansion))
        expansion = {
          id: photo.id,
          length: photo.selections.length
        }
    }

    return expansion
  }, {
    memoizeOptions: { resultEqualityCheck: shallowEqual }
  })
