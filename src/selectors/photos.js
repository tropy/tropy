import { createSelector as memo } from '@reduxjs/toolkit'
import { getSelectedItems } from './items.js'
import { selectMatchFilter } from '../slices/qr.js'
import { blank, pluck } from '../common/util.js'
import { createSequence } from '../common/sequence.js'


const withErrors = ([, photo]) =>
  !!photo.broken && !photo.consolidated

const notConsolidating = ([, photo]) =>
  !photo.consolidating

const toId = ([id]) => Number(id)
const toPhoto = ([, photo]) => photo


const getPhotos = ({ photos }) => photos

export const getSelectedPhoto = memo(
  getPhotos,
  ({ nav }) => nav.selection.photo,
  (photos, id) => (id != null) ? photos[id] : null
)

const expandItemPhotos = (items, photos) => {
  let [lst, push] = createSequence()

  for (let item of items) {
    for (let id of item.photos) {
      let photo = photos[id]
      if (photo != null) push(photo)
    }
  }

  return lst
}

export const getItemPhotos = (state, props) =>
  expandItemPhotos(
    pluck(state.items, props.items),
    state.photos)

// The photos of the selected items; with the match filter on,
// only those that contributed to the search match (themselves,
// their selections, or the notes of either), and the current photo:
// what is selected stays visible.
export const getVisiblePhotos = memo(
  getPhotos,
  getSelectedItems,
  selectMatchFilter,
  (state) => selectMatchFilter(state) && state.nav.selection.photo,

  (photos, items, filter, current) => {
    let visible = expandItemPhotos(items, photos)
    if (filter == null) return visible

    let [lst, push] = createSequence()
    for (let photo of visible)
      if (filter.photos[photo.id] || photo.id === current) push(photo)

    return lst
  }
)

export const getPhotosWithErrors = memo(
  getPhotos,
  (photos) =>
    Object.entries(photos)
      .filter(withErrors)
      .filter(notConsolidating)
      .map(toId))

export const getPhotosForConsolidation =
  ({ photos }, ids) =>
    blank(ids) ?
      Object.entries(photos)
        .filter(notConsolidating)
        .map(toPhoto) :
      ids
        .map(id => photos[id])
        .filter(photo => !photo.consolidating)
