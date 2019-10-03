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
    notes: getPhotoNotes(photo, notepad, notes)
  }
)

const getPhotoNotes = (photo, notepad, notes) => {
  let photoNotes = photo.notes.map(id => ({
    id,
    ...serialize(notes[id], { format: { html: true }, localize: false }),
    ...notepad[id]
  }))

  let notesArr = Object.keys(notes).map(key => notes[key])
  let selectionNotes = photo.selections.map(id => ({
    id,
    ...serialize(
      notesArr.find(({ selection }) => selection === id),
      { format: { html: true }, localize: false }
    )
  }))

  return photoNotes.concat(selectionNotes)
}


const getItemExpanded =
  (item, photos, metadata, notes, notepad, tags, ontology) => (
  (item == null) ? null : {
    ...item,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[item.id],
      props: ontology.props,
      template: ontology.template[item.template]
    }),
    photos: item.photos.map(id =>
      getPhotoExpanded(photos[id], metadata, notes, notepad, ontology)),
    tags: item.tags.map(t => tags[t].name)
  }
)

const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ notepad }) => notepad,
  ({ tags }) => tags,
  ({ ontology }) => ontology,
  (ids, items, photos, metadata, notes, notepad, tags, ontology) =>
  ids.map(id =>
    getItemExpanded(items[id],
      photos,
      metadata,
      notes,
      notepad,
      tags,
      ontology))
)

module.exports = {
  getPrintableItems
}
