'use strict'

const { createSelector: memo } = require('reselect')
const { getMetadataFields } = require('./metadata')
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

const expandPhoto = (photo, metadata, ontology) => (
  (photo == null) ? null : {
    ...photo,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[photo.id],
      props: ontology.props,
      template: ontology.template[photo.template]
    })
  }
)

const expandItem = (item, photos, metadata, ontology) => (
  (item == null) ? null : {
    ...item,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[item.id],
      props: ontology.props,
      template: ontology.template[item.template]
    }),
    photos: item.photos.map(id =>
      expandPhoto(photos[id], metadata, ontology))
  }
)

const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ ontology }) => ontology,
  (ids, items, photos, metadata, ontology) =>
    ids.map(id => expandItem(items[id], photos, metadata, ontology))
)

module.exports = {
  getItems,
  getListHold,
  getPrintableItems,
  getSelectedItems,
  getSelectedItemTemplate,
  getVisibleItems
}
