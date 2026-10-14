import { createStore } from '../../support/react.js'
import { create } from '#tropy/common/selection.js'
import { nav } from '#tropy/reducers/nav.js'
import { panel } from '#tropy/reducers/panel.js'

// A store with item 1 selected, its photos visible
// and `current` the current photo.
// With `expandable`, photo 1 has `selections` (9);
// with `expanded`, it is also expanded.
export const createPhotoStore = ({
  photos = [1, 2],
  current = null,
  expanded = false,
  expandable = expanded,
  selections = [9],
  keymap = {}
} = {}) =>
  createStore({
    items: { 1: { id: 1, photos, tags: [], lists: [] } },
    photos: Object.fromEntries(photos.map(id => [id, {
      id,
      item: 1,
      selections: (expandable && id === 1) ? selections : [],
      notes: []
    }])),
    selections: expandable ?
      Object.fromEntries(selections.map(id => [id, { id, photo: 1, notes: [] }])) :
      {},
    qr: { items: [1] },
    panel: { ...panel(undefined, {}), expand: expanded ? { 1: 1 } : {} },
    nav: { ...nav(undefined, {}), item: create([1]), photo: current },
    keymap
  })
