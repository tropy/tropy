import { createStore } from '../../support/react.js'
import { create } from '#tropy/common/selection.js'
import { nav } from '#tropy/reducers/nav.js'

// A store with item 1 selected, its photos visible
// and `current` the current photo.
export const createPhotoStore = ({ photos = [1, 2], current = null } = {}) =>
  createStore({
    items: { 1: { id: 1, photos, tags: [], lists: [] } },
    photos: Object.fromEntries(photos.map(id =>
      [id, { id, item: 1, selections: [], notes: [] }])),
    qr: { items: [1] },
    nav: { ...nav(undefined, {}), item: create([1]), photo: current }
  })
