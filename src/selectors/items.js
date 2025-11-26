import { createSelector as memo } from 'reselect'
import { pluck } from './util.js'
import { BLANK } from '../common/util.js'

export const getItems = ({ items }) => items

export const getSelectedItems = memo(
  ({ items }) => items, ({ nav }) => (nav.items), pluck
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
  ([item, ...items]) => (item == null) ? BLANK : {
    id: item.template,
    mixed: items.find(it => it.template !== item.template) != null
  }
)
