import { createSelector as memo } from '@reduxjs/toolkit'
import { BLANK } from '../common/util.js'
import { selectActiveItems, selectItemCursor } from '../slices/nav/selectors.js'

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
