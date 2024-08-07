import { createSelector as memo } from 'reselect'
import { getMetadataFields } from './metadata.js'
import { serialize } from '../editor/serialize.js'

const getPhotoExpanded = (
  photo,
  selections,
  metadata,
  notes,
  notepad,
  ontology) => (
  (photo == null) ? null : {
    ...photo,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[photo.id],
      props: ontology.props,
      template: ontology.template[photo.template]
    }),
    notes: [
      ...photo.notes,
      ...photo.selections.flatMap(id => selections?.[id]?.notes)
    ].map(id => ({
      id,
      ...serialize(notes[id], { format: { html: true }, localize: false }),
      ...notepad[id]
    }))
  }
)

const getItemExpanded =
  (item, photos, selections, metadata, notes, notepad, tags, ontology) => (
    (item == null) ? null : {
      ...item,
      data: getMetadataFields(null, {
        compact: true,
        data: metadata[item.id],
        props: ontology.props,
        template: ontology.template[item.template]
      }),
      photos: item.photos.map(id =>
        getPhotoExpanded(
          photos[id],
          selections,
          metadata,
          notes,
          notepad,
          ontology)),
      tags: item.tags.map(t => tags[t].name)
    }
  )

export const getPrintableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ selections }) => selections,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ notepad }) => notepad,
  ({ tags }) => tags,
  ({ ontology }) => ontology,
  (ids, items, photos, selections, metadata, notes, notepad, tags, ontology) =>
    ids.map(id =>
      getItemExpanded(items[id],
        photos,
        selections,
        metadata,
        notes,
        notepad,
        tags,
        ontology))
)
