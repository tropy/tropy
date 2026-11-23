import { createSelector as memo } from '@reduxjs/toolkit'
import { getItemSelection } from './items.js'
import { pluck as pluckItems } from './util.js'
import { blank, pluck } from '../common/util.js'
import { createSequence } from '../common/sequence.js'


const withErrors = ([, photo]) =>
  !!photo.broken && !photo.consolidated

const notConsolidating = ([, photo]) =>
  !photo.consolidating

const toId = ([id]) => Number(id)
const toPhoto = ([, photo]) => photo


const getPhotos = ({ photos }) => photos

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

// The selected items in the order of the results, then those
// not among them (e.g. new ones): unlike getSelectedItems,
// not the primary one first, so the photos keep their order
// when the item cursor moves.
const getItemsInOrder = memo(
  ({ items }) => items,
  getItemSelection,
  (items, selection) => {
    let ids = selection.elements()
    let inResults = new Set(ids)

    return pluckItems(items, [
      ...ids,
      ...selection.ids().filter(id => !inResults.has(id))
    ])
  }
)

// The photos of the selected items.
export const getVisiblePhotos = memo(
  getPhotos,
  getItemsInOrder,
  (photos, items) => expandItemPhotos(items, photos)
)

export const getVisibleSelections = memo(
  ({ selections }) => selections,
  getVisiblePhotos,

  (selections, photos) =>
    photos
      .flatMap(photo => photo.selections ?? [])
      .map(id => selections[id])
      .filter(selection => selection != null)
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
