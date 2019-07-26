'use strict'

const { createSelector: memo } = require('reselect')
const { getMetadataFields } = require('./metadata')
const { serialize } = require('../export/note')

const getPhotoExpanded = (photo, metadata, notes, ontology) => (
  (photo == null) ? null : {
    ...photo,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[photo.id],
      props: ontology.props,
      template: ontology.template[photo.template]
    }),
    notes: photo.notes.map(id => ({
      id,
      ...serialize(notes[id], { format: { html: true }, localize: false })
    }))
  }
)

const getItemExpanded = (item, photos, metadata, notes, ontology) => (
  (item == null) ? null : {
    ...item,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[item.id],
      props: ontology.props,
      template: ontology.template[item.template]
    }),
    photos: item.photos.map(id =>
      getPhotoExpanded(photos[id], metadata, notes, ontology))
  }
)

const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ ontology }) => ontology,
  (ids, items, photos, metadata, notes, ontology) =>
  ids.map(id =>
    getItemExpanded(items[id], photos, metadata, notes, ontology))
)

module.exports = {
  getPrintableItems
}
