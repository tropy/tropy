import { createStore } from '../../support/react.js'
import { create } from '#tropy/common/selection.js'
import nav from '#tropy/slices/nav/index.js'

// A store with items 1-3 in the results and `selected` selected.
export const createItemStore = (selected = [1]) => {
  let ids = [1, 2, 3]

  return createStore({
    items: Object.fromEntries(ids.map(id =>
      [id, { id, photos: [], tags: [], lists: [] }])),
    qr: { items: ids },
    nav: {
      ...nav(undefined, {}),
      selection: { ...nav(undefined, {}).selection, item: create(selected) }
    },
    intl: { messages: {} }
  })
}
