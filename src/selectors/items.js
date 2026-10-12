import { createSelector as memo } from 'reselect'
import { pluck } from './util.js'
import { BLANK } from '../common/util.js'
import { Selection } from '../common/selection.js'

export const getItemSelection = memo(
  ({ nav }) => nav.item,
  ({ qr }) => qr.items,
  (state, seq) => new Selection(state, seq)
)

// All selected items: primary first, the rest unordered.
export const getSelectedItems = memo(
  ({ items }) => items,
  getItemSelection,
  (items, selection) => pluck(items, selection.ids())
)

// The primary selected item represents the selection
// (merge target, bulk editor values and template).
// Selected items not in the results fall back to any one.
export const getPrimaryItemId = memo(
  getItemSelection,
  (selection) => selection.ids()[0] ?? null
)

export const getVisibleItems = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

export const getListHoldIndex = memo(
  getSelectedItems,
  (items) => items.reduce((holdIndex, item) => {
    for (let list of item.lists) holdIndex[list] = true
    return holdIndex
  }, {})
)

export const getSelectedItemTemplate = memo(
  getSelectedItems,
  getPrimaryItemId,
  (items, first) => {
    let item = items.find(it => it.id === first) ?? items[0]

    return (item == null) ? BLANK : {
      id: item.template,
      mixed: items.some(it => it.template !== item.template)
    }
  }
)
