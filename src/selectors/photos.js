import { createSelector as memo } from '@reduxjs/toolkit'
import { selectActivePhotos } from '../slices/nav/selectors.js'
import { blank } from '../common/util.js'


const withErrors = ([, photo]) =>
  !!photo.broken && !photo.consolidated

const notConsolidating = ([, photo]) =>
  !photo.consolidating

const toId = ([id]) => Number(id)
const toPhoto = ([, photo]) => photo


const getPhotos = ({ photos }) => photos

export const getVisibleSelections = memo(
  ({ selections }) => selections,
  selectActivePhotos,

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
