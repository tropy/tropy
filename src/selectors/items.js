import { createSelector as memo } from '@reduxjs/toolkit'
import { BLANK } from '../common/util.js'
import { Selection } from '../common/selection.js'
import { selectItemSequence } from '../slices/qr.js'
import { selectActiveItems, selectItemCursor } from '../slices/nav/cursor.js'

export const getItemSelection = memo(
  ({ nav }) => nav.selection.item,
  selectItemSequence,
  (state, seq) => new Selection(state, seq)
)

export const getListHoldIndex = memo(
  selectActiveItems,
  (items) => items.reduce((holdIndex, item) => {
    for (let list of item.lists) holdIndex[list] = true
    return holdIndex
  }, {})
)

export const getSelectedItemTemplate = memo(
  selectActiveItems,
  selectItemCursor,
  (items, first) => {
    let item = items.find(it => it.id === first) ?? items[0]

    return (item == null) ? BLANK : {
      id: item.template,
      mixed: items.some(it => it.template !== item.template)
    }
  }
)
