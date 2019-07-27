'use strict'

const { createSelector: memo } = require('reselect')
const { getMetadataFields } = require('./metadata')
const { serialize } = require('../export/note')

const getPhotoExpanded = (photo, metadata, notes, notepad, ontology) => (
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
      ...serialize(notes[id], { format: { html: true }, localize: false }),
      ...notepad[id]
    }))
  }
)

const getItemExpanded = (item, photos, metadata, notes, notepad, ontology) => (
  (item == null) ? null : {
    ...item,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[item.id],
      props: ontology.props,
      template: ontology.template[item.template]
    }),
    photos: item.photos.map(id =>
      getPhotoExpanded(photos[id], metadata, notes, notepad, ontology))
  }
)

const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ notepad }) => notepad,
  ({ ontology }) => ontology,
  (ids, items, photos, metadata, notes, notepad, ontology) =>
  ids.map(id =>
    getItemExpanded(items[id], photos, metadata, notes, notepad, ontology))
)

module.exports = {
  getPrintableItems
}
