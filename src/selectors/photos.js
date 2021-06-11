import { createSelector as memo } from 'reselect'
import { seq, compose, filter, into, map, cat, keep } from 'transducers.js'
import { getSelectedItems } from './items'
import { blank, pluck } from '../common/util'


const withErrors = ([, photo]) =>
  !!photo.broken && !photo.consolidated

const notConsolidating = ([, photo]) =>
  !photo.consolidating

const toId = ([id]) => Number(id)
const toPhoto = ([, photo]) => photo


const getPhotos = ({ photos }) => photos

export const getSelectedPhoto = memo(
  getPhotos,
  ({ nav }) => nav.photo,
  (photos, id) => (id != null) ? photos[id] : null
)

const expandItemPhotos = (items, photos) => {
  let k = 0
  let idx = {}
  let lst = seq(items, compose(
    map(item => item.photos),
    cat,
    map(id => photos[id]),
    keep(),
    map(photo => (idx[photo.id] = k++, photo))
  ))

  lst.idx = idx
  return lst
}

export const getItemPhotos = (state, props) =>
  expandItemPhotos(
    pluck(state.items, props.items),
    state.photos)

export const getVisiblePhotos = memo(
  getPhotos,
  getSelectedItems,

  (photos, items) =>
    expandItemPhotos(items, photos)
)

export const getPhotosWithErrors = memo(
  getPhotos,
  (photos) =>
    into([], compose(
      filter(withErrors),
      filter(notConsolidating),
      map(toId)
    ), photos))

export const getPhotosForConsolidation =
  ({ photos }, ids) =>
    blank(ids) ?
      into([],
        compose(
          filter(notConsolidating),
          map(toPhoto)
        ), photos) :
      seq(ids,
        compose(
          map(id => photos[id]),
          filter(photo => !photo.consolidating)))
