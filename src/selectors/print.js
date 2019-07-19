'use strict'

const { createSelector: memo } = require('reselect')
const { getMetadataFields } = require('./metadata')
const { toHTML } = require('../components/editor/serialize')


const getNoteSerialized = (note, format = ['text']) => (
  (note == null) ? null : format.reduce((acc, fmt) => {
    switch (fmt) {
      case 'text':
        acc.text = note.text
        break
      case 'html':
        acc.html = toHTML(note.state.doc)
        break
    }
    return acc
  }, {})
)

const getPhotoExpanded = (photo, metadata, notes, ontology) => (
  (photo == null) ? null : {
    ...photo,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[photo.id],
      props: ontology.props,
      template: ontology.template[photo.template]
    }),
    notes: photo.notes.map(id =>
      getNoteSerialized(notes[id], ['html']))
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
  getNoteSerialized,
  getPrintableItems
}
