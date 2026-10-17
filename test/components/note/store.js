import { createStore } from '../../support/react.js'
import { create } from '#tropy/common/selection.js'
import { nav } from '#tropy/reducers/nav.js'

// A store with item 1 and its photo 1 selected,
// the photo's `count` notes visible and `note` selected.
export const createNoteStore = ({
  count = 2,
  note = 1,
  keymap = {}
} = {}) => {
  let ids = Array.from({ length: count }, (_, i) => i + 1)

  return createStore({
    items: { 1: { id: 1, photos: [1], tags: [], lists: [] } },
    photos: { 1: { id: 1, item: 1, selections: [], notes: ids } },
    notes: Object.fromEntries(ids.map(id =>
      [id, { id, photo: 1, text: `${id}` }])),
    qr: { items: [1] },
    nav: { ...nav(undefined, {}), item: create([1]), photo: 1, note },
    keymap
  })
}
