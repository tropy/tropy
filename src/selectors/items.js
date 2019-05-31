'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')
const EMPTY = {}

const getItems = ({ items }) => items

const getSelectedItems = memo(
  ({ items }) => items, ({ nav }) => (nav.items), pluck
)

const getVisibleItems = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

const getListHold = memo(
  getSelectedItems,
  (items) => items.reduce((hold, item) => {
    for (let list of item.lists) hold[list] = true
    return hold
  }, {})
)

const getSelectedItemTemplate = memo(
  getSelectedItems,
  ([item, ...items]) => (item == null) ? EMPTY : {
    id: item.template,
    mixed: items.find(it => it.template !== item.template) != null
  }
)

const expandPhoto = (photo, metadata) => (
  (photo == null) ? null : {
    ...photo,
    data: metadata[photo.id]
  }
)

const expandItem = (item, photos, metadata) => (
  (item == null) ? null : {
    ...item,
    data: metadata[item.id],
    photos: item.photos.map(id => expandPhoto(photos[id], metadata))
  }
)

const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  (ids, items, photos, metadata) =>
    ids.map(id => expandItem(items[id], photos, metadata))
)

module.exports = {
  getItems,
  getListHold,
  getPrintableItems,
  getSelectedItems,
  getSelectedItemTemplate,
  getVisibleItems
}
