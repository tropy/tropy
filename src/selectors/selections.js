import { createSelector as memo } from 'reselect'
import { seq, compose, cat, map, keep } from 'transducers.js'
import { getVisiblePhotos } from './photos'
import { pluck } from '../common/util'

const NOTHING = []
const getSelections = ({ selections }) => selections

export const getActiveSelection = memo(
  getSelections,
  ({ nav }) => nav.selection,
  (selections, id) => (id != null) ? selections[id] : null
)

export const getActiveSelectionData = memo(
  ({ metadata }) => metadata,
  ({ nav }) => nav.selection,
  (metadata, id) => (id != null) ? metadata[id] : null
)


export const getPhotoSelections = memo(
  ({ nav, photos }) => photos[nav.photo]?.selections,
  getSelections,
  (photoSelections, selections) =>
    (photoSelections != null) ?
      pluck(selections, photoSelections) :
      NOTHING

)

export const getVisibleSelections = memo(
  getSelections,
  getVisiblePhotos,

  (selections, photos) =>
    seq(photos, compose(
      map(photo => photo.selections),
      keep(),
      cat,
      map(id => selections[id]),
      keep()
    ))
)
