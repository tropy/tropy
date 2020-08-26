import { createSelector as memo } from 'reselect'
import { pluck } from './util'
import { BLANK } from '../common/util'

export const getItems = ({ items }) => items

export const getSelectedItems = memo(
  ({ items }) => items, ({ nav }) => (nav.items), pluck
)

export const getVisibleItems = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

export const getListHold = memo(
  getSelectedItems,
  (items) => items.reduce((hold, item) => {
    for (let list of item.lists) hold[list] = true
    return hold
  }, {})
)

export const getSelectedItemTemplate = memo(
  getSelectedItems,
  ([item, ...items]) => (item == null) ? BLANK : {
    id: item.template,
    mixed: items.find(it => it.template !== item.template) != null
  }
)
